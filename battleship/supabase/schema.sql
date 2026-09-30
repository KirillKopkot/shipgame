-- =====================================================================
-- Salvo multiplayer schema. Run once in the Supabase SQL Editor.
-- Safe to re-run: tables use IF NOT EXISTS, policies/triggers are dropped first.
--
-- Prerequisite (dashboard): Authentication -> Sign In / Providers ->
-- enable "Allow anonymous sign-ins". Anonymous users use the `authenticated`
-- role, so every policy below is granted to `authenticated` only.
--
-- Trust model: a player's ships are readable only by that player, so the
-- DEFENDER's client works out the result of every shot (src/game) and reports
-- it with report_result(). The database checks who may report, when, and keeps
-- the room state consistent, but it cannot verify that the reported result is
-- honest; that would need server-side game logic.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id    uuid not null references auth.users (id) on delete cascade,
  guest_id   uuid references auth.users (id) on delete set null,
  status     text not null default 'waiting'
             check (status in ('waiting', 'placing', 'playing', 'finished')),
  turn       uuid references auth.users (id) on delete set null,
  winner     uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (guest_id is null or guest_id <> host_id)
);

create table if not exists public.room_boards (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ships   jsonb not null,
  ready   boolean not null default false,
  primary key (room_id, user_id)
);

create table if not exists public.moves (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.rooms (id) on delete cascade,
  by_user    uuid not null references auth.users (id) on delete cascade,
  x          smallint not null check (x between 0 and 9),
  y          smallint not null check (y between 0 and 9),
  result     text check (result in ('miss', 'hit', 'sunk')),
  sunk_cells jsonb,
  created_at timestamptz not null default now(),
  -- a cell can be shot only once per shooter
  unique (room_id, by_user, x, y),
  -- sunk_cells go together with result = 'sunk'
  check (coalesce(result = 'sunk', false) = (sunk_cells is not null))
);

-- At most one unreported shot per room: the shooter must wait for the report.
create unique index if not exists moves_one_pending_per_room
  on public.moves (room_id) where result is null;

create index if not exists moves_room_id_idx on public.moves (room_id, id);

-- ---------------------------------------------------------------------
-- Row Level Security: enabled explicitly on every table
-- ---------------------------------------------------------------------

alter table public.rooms       enable row level security;
alter table public.room_boards enable row level security;
alter table public.moves       enable row level security;

-- Defense in depth: besides RLS, take away privileges nobody should have.
-- Rooms and moves can never be updated or deleted directly by clients;
-- their changes go through the functions below.
revoke all on public.rooms, public.room_boards, public.moves from anon, authenticated;
grant select, insert         on public.rooms       to authenticated;
grant select, insert, update on public.room_boards to authenticated;
grant select, insert         on public.moves       to authenticated;

-- ---------------------------------------------------------------------
-- Helper functions used by policies (SECURITY DEFINER so a policy on one
-- table can look at another without recursing into its RLS; they only
-- return a boolean about the caller).
-- ---------------------------------------------------------------------

create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room and (select auth.uid()) in (r.host_id, r.guest_id)
  );
$$;

-- Room is in the placing phase and the caller is one of its two players.
create or replace function public.room_can_place(p_room uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room
      and r.status = 'placing'
      and (select auth.uid()) in (r.host_id, r.guest_id)
  );
$$;

-- It is the caller's turn in a running match and no earlier shot is waiting for its report.
create or replace function public.can_shoot(p_room uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room and r.status = 'playing' and r.turn = (select auth.uid())
  )
  and not exists (
    select 1 from public.moves m where m.room_id = p_room and m.result is null
  );
$$;

-- ---------------------------------------------------------------------
-- Policies: rooms
-- ---------------------------------------------------------------------

drop policy if exists rooms_select_members on public.rooms;
-- Protects: only the host and the guest can see a room. Strangers cannot list
-- rooms or their codes; a guest gets in through join_room(), not by reading.
create policy rooms_select_members on public.rooms
  for select to authenticated
  using ((select auth.uid()) in (host_id, guest_id));

drop policy if exists rooms_insert_as_host on public.rooms;
-- Protects: you can only create a room in your own name, empty and in the
-- 'waiting' state. Nobody can create a room that already has a guest, a turn
-- or a winner.
create policy rooms_insert_as_host on public.rooms
  for insert to authenticated
  with check (
    host_id = (select auth.uid())
    and guest_id is null
    and status = 'waiting'
    and turn is null
    and winner is null
  );

-- There is deliberately NO update or delete policy on rooms: status, turn,
-- winner and guest_id can only change through join_room(), report_result()
-- and the room_boards trigger below, so a player cannot declare themselves
-- the winner, steal the turn, or replace the opponent.

-- ---------------------------------------------------------------------
-- Policies: room_boards (ships are private, forever)
-- ---------------------------------------------------------------------

drop policy if exists room_boards_select_own on public.room_boards;
-- Protects: the opponent's ship layout is never readable. Only the owner reads
-- their own row, at any time, including after the match. (room_boards is also
-- NOT added to the realtime publication.)
create policy room_boards_select_own on public.room_boards
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists room_boards_insert_own on public.room_boards;
-- Protects: you can only create your own board, only for a room you play in,
-- and only while the room is in the placing phase (no new layout mid-match).
create policy room_boards_insert_own on public.room_boards
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.room_can_place(room_id));

drop policy if exists room_boards_update_own on public.room_boards;
-- Protects: only the owner can change their board, and only while placing.
-- After 'ready' the trigger below freezes it as well.
create policy room_boards_update_own on public.room_boards
  for update to authenticated
  using (user_id = (select auth.uid()) and public.room_can_place(room_id))
  with check (user_id = (select auth.uid()));

-- No delete policy: a ready board cannot be thrown away and re-made.

-- ---------------------------------------------------------------------
-- Policies: moves
-- ---------------------------------------------------------------------

drop policy if exists moves_select_members on public.moves;
-- Protects: only the two players see the shots of their match.
create policy moves_select_members on public.moves
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists moves_insert_shooter on public.moves;
-- Protects: you can only shoot as yourself, in your own match, on your own turn,
-- when no earlier shot is still unreported, and you cannot write the result
-- yourself (the defender reports it via report_result()).
create policy moves_insert_shooter on public.moves
  for insert to authenticated
  with check (
    by_user = (select auth.uid())
    and result is null
    and sunk_cells is null
    and public.can_shoot(room_id)
  );

-- No update or delete policy on moves: results are written only by report_result().

-- ---------------------------------------------------------------------
-- Functions the client calls
-- ---------------------------------------------------------------------

-- Join a room by code. A guest cannot read a room before joining, so this is a
-- function. Becoming the guest is possible only while guest_id is null.
create or replace function public.join_room(p_code text)
returns public.rooms
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r public.rooms;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into r from public.rooms where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'room_not_available';
  end if;

  -- already in this room (host, or a guest who reconnects): just return it
  if v_uid = r.host_id or v_uid = r.guest_id then
    return r;
  end if;

  if r.guest_id is not null or r.status <> 'waiting' then
    raise exception 'room_not_available';
  end if;

  update public.rooms
     set guest_id = v_uid, status = 'placing'
   where id = r.id
   returning * into r;
  return r;
end;
$$;

-- The defender reports what a shot did. Updates the move and the room in one
-- transaction: defeated -> finished + winner; miss -> the defender gets the
-- turn; hit/sunk -> the shooter keeps it.
create or replace function public.report_result(
  p_move_id   bigint,
  p_result    text,
  p_sunk_cells jsonb,
  p_defeated  boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  m public.moves;
  r public.rooms;
  v_member boolean;
begin
  select * into m from public.moves where id = p_move_id for update;
  if not found then
    raise exception 'move_not_found';
  end if;

  select * into r from public.rooms where id = m.room_id for update;
  v_member := coalesce(v_uid = r.host_id, false) or coalesce(v_uid = r.guest_id, false);

  if not v_member or v_uid = m.by_user then
    raise exception 'not_defender';       -- only the player who was shot at may report
  end if;
  if r.status <> 'playing' then
    raise exception 'room_not_playing';
  end if;
  if m.result is not null then
    raise exception 'already_reported';
  end if;
  if p_result not in ('miss', 'hit', 'sunk') then
    raise exception 'bad_result';
  end if;

  if p_result = 'sunk' then
    if p_sunk_cells is null
       or jsonb_typeof(p_sunk_cells) <> 'array'
       or jsonb_array_length(p_sunk_cells) not between 1 and 4 then
      raise exception 'bad_sunk_cells';
    end if;
  elsif p_sunk_cells is not null then
    raise exception 'unexpected_sunk_cells';
  end if;

  if p_defeated and p_result <> 'sunk' then
    raise exception 'bad_defeat';         -- the last ship can only go down by a sinking shot
  end if;

  update public.moves
     set result = p_result, sunk_cells = p_sunk_cells
   where id = p_move_id;

  if p_defeated then
    update public.rooms set status = 'finished', winner = m.by_user, turn = null where id = r.id;
  elsif p_result = 'miss' then
    update public.rooms set turn = v_uid where id = r.id;
  end if;
end;
$$;

revoke all on function public.join_room(text) from public, anon;
revoke all on function public.report_result(bigint, text, jsonb, boolean) from public, anon;
revoke all on function public.is_room_member(uuid) from public, anon;
revoke all on function public.room_can_place(uuid) from public, anon;
revoke all on function public.can_shoot(uuid) from public, anon;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.report_result(bigint, text, jsonb, boolean) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.room_can_place(uuid) to authenticated;
grant execute on function public.can_shoot(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Triggers on room_boards
-- ---------------------------------------------------------------------

-- Once a board is ready it is frozen: nobody can move ships after seeing shots.
create or replace function public.room_boards_lock()
returns trigger
language plpgsql
as $$
begin
  if old.ready then
    raise exception 'board_locked';
  end if;
  if new.room_id <> old.room_id or new.user_id <> old.user_id then
    raise exception 'immutable_key';
  end if;
  return new;
end;
$$;

drop trigger if exists room_boards_lock on public.room_boards;
create trigger room_boards_lock
  before update on public.room_boards
  for each row execute function public.room_boards_lock();

-- When both players are ready the match starts (host shoots first). This is how a
-- player learns that the opponent is ready without being able to read their board.
create or replace function public.room_boards_start_match()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.ready and (
    select count(*) from public.room_boards b where b.room_id = new.room_id and b.ready
  ) = 2 then
    update public.rooms
       set status = 'playing', turn = host_id
     where id = new.room_id and status = 'placing';
  end if;
  return null;
end;
$$;

drop trigger if exists room_boards_start_match on public.room_boards;
create trigger room_boards_start_match
  after insert or update on public.room_boards
  for each row execute function public.room_boards_start_match();

-- ---------------------------------------------------------------------
-- Realtime: rooms and moves only. Realtime applies the SELECT policies above,
-- so a subscriber receives changes of their own rooms only.
-- room_boards is intentionally NOT published.
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'moves'
  ) then
    alter publication supabase_realtime add table public.moves;
  end if;
end;
$$;
