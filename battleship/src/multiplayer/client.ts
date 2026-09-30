import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export class NotConfiguredError extends Error {
  constructor() {
    super('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (see .env.example)')
    this.name = 'NotConfiguredError'
  }
}

/** False when the Supabase env variables are missing; the UI shows a message instead of failing. */
export function isConfigured(): boolean {
  return Boolean(url && anonKey)
}

let client: SupabaseClient | null = null

/** The client is created on first use, so a missing config never breaks single-player. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) throw new NotConfiguredError()
  client ??= createClient(url, anonKey)
  return client
}

let inFlight: Promise<string> | null = null

/**
 * Makes sure there is a signed-in user and returns their id. An existing session is reused;
 * otherwise one anonymous user is created. Concurrent calls share the same request, so a
 * second anonymous user is never created by accident.
 */
export function ensureSession(): Promise<string> {
  inFlight ??= (async () => {
    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session.user.id

    const { data: created, error } = await supabase.auth.signInAnonymously()
    if (error || !created.user) throw error ?? new Error('Anonymous sign-in failed')
    return created.user.id
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}
