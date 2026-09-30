import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Board } from '../game/types'
import {
  loadMyBoard,
  loadRoom,
  reportResult,
  saveBoard,
  sendShot,
  setReady,
  subscribeRoom,
  joinRoom,
} from '../multiplayer/api'
import { ensureSession } from '../multiplayer/client'
import { describeError } from '../multiplayer/errors'
import { clearRoomCode, saveRoomCode } from '../multiplayer/roomStorage'
import { buildMatchState, mergeMoves, shipsOfBoard } from '../multiplayer/state'
import type { MatchState } from '../multiplayer/state'
import type { Move, Room, StoredShip } from '../multiplayer/types'

interface OnlineState {
  phase: 'loading' | 'ready' | 'error'
  /** Why loading failed (phase = error). */
  error: string | null
  userId: string | null
  room: Room | null
  moves: Move[]
  /** My own layout, once saved. Only I can read it. */
  myShips: StoredShip[] | null
  myReady: boolean
  /** The live channel dropped; data may be stale until it reconnects. */
  connectionLost: boolean
  /** A failed action (saving the board, firing, reporting) the player can retry. */
  actionError: string | null
}

const INITIAL: OnlineState = {
  phase: 'loading',
  error: null,
  userId: null,
  room: null,
  moves: [],
  myShips: null,
  myReady: false,
  connectionLost: false,
  actionError: null,
}

export interface OnlineMatch extends OnlineState {
  /** Match state built from the moves; null until my board is known. */
  match: MatchState | null
  saving: boolean
  /** Reloads everything (after an error or a lost connection). */
  retry: () => void
  ready: (board: Board) => Promise<void>
  fire: (x: number, y: number) => Promise<void>
  dismissActionError: () => void
}

/**
 * Loads a room by code (joining it if it is free), keeps it live over Realtime and, as the
 * defender, reports the result of every opponent shot exactly once.
 */
export function useOnlineMatch(code: string): OnlineMatch {
  const [state, setState] = useState<OnlineState>(INITIAL)
  const [attempt, setAttempt] = useState(0)
  const [reportTick, setReportTick] = useState(0)
  const [saving, setSaving] = useState(false)
  // Moves whose result was already sent (or is being sent): never report twice.
  const reported = useRef(new Set<number>())

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    async function load() {
      try {
        const userId = await ensureSession()
        const room = await joinRoom(code)
        const [{ moves }, board] = await Promise.all([loadRoom(room.id), loadMyBoard(room.id)])
        if (cancelled) return

        setState({
          ...INITIAL,
          phase: 'ready',
          userId,
          room,
          moves,
          myShips: board?.ships ?? null,
          myReady: board?.ready ?? false,
        })

        let lost = false
        unsubscribe = subscribeRoom(room.id, {
          onRoom: (next) => !cancelled && setState((s) => ({ ...s, room: next })),
          onMove: (move) => !cancelled && setState((s) => ({ ...s, moves: mergeMoves(s.moves, move) })),
          onStatus: (status) => {
            if (cancelled) return
            if (status === 'SUBSCRIBED') {
              if (!lost) return
              lost = false
              // events may have been missed while offline: fetch the current state
              loadRoom(room.id)
                .then((fresh) => {
                  if (cancelled) return
                  setState((s) => ({
                    ...s,
                    room: fresh.room,
                    moves: mergeMoves(s.moves, fresh.moves),
                    connectionLost: false,
                  }))
                })
                .catch(() => !cancelled && setState((s) => ({ ...s, connectionLost: true })))
            } else {
              lost = true
              setState((s) => ({ ...s, connectionLost: true }))
            }
          },
        })
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, phase: 'error', error: describeError(e) }))
      }
    }

    void load()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [code, attempt])

  // Remember the room while the match is open, forget it when it is over.
  const roomStatus = state.room?.status
  useEffect(() => {
    if (!roomStatus) return
    if (roomStatus === 'finished') clearRoomCode()
    else saveRoomCode(code)
  }, [roomStatus, code])

  const match = useMemo(
    () =>
      state.userId && state.myShips
        ? buildMatchState({ myShips: state.myShips, myId: state.userId, moves: state.moves })
        : null,
    [state.userId, state.myShips, state.moves],
  )

  // Defender: report what the opponent's shot did to my board. Also covers an unreported
  // shot found after a reload.
  const pending = match?.pendingReport ?? null
  useEffect(() => {
    if (!pending) return
    const id = pending.move.id
    if (reported.current.has(id)) return
    reported.current.add(id)

    reportResult(id, pending.outcome).catch((e: unknown) => {
      if (e instanceof Error && e.message.includes('already_reported')) return
      reported.current.delete(id)
      setState((s) => ({ ...s, actionError: describeError(e) }))
    })
  }, [pending, reportTick])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, phase: s.phase === 'error' ? 'loading' : s.phase, error: null, actionError: null }))
    setReportTick((t) => t + 1)
    setAttempt((a) => a + 1)
  }, [])

  const ready = useCallback(
    async (board: Board) => {
      const room = state.room
      if (!room) return
      setSaving(true)
      try {
        await saveBoard(room.id, board)
        await setReady(room.id)
        setState((s) => ({ ...s, myShips: shipsOfBoard(board), myReady: true, actionError: null }))
      } catch (e) {
        setState((s) => ({ ...s, actionError: describeError(e) }))
      } finally {
        setSaving(false)
      }
    },
    [state.room],
  )

  const fire = useCallback(
    async (x: number, y: number) => {
      const room = state.room
      if (!room) return
      try {
        const move = await sendShot(room.id, x, y)
        setState((s) => ({ ...s, moves: mergeMoves(s.moves, move), actionError: null }))
      } catch (e) {
        setState((s) => ({ ...s, actionError: describeError(e) }))
      }
    },
    [state.room],
  )

  const dismissActionError = useCallback(() => {
    setState((s) => ({ ...s, actionError: null }))
    setReportTick((t) => t + 1)
  }, [])

  return { ...state, match, saving, retry, ready, fire, dismissActionError }
}
