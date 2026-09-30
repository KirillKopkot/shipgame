import { NotConfiguredError } from './client'

export type ErrorKind = 'not-configured' | 'room-unavailable' | 'network' | 'other'

const NETWORK_HINTS = ['failed to fetch', 'networkerror', 'network request failed', 'load failed', 'timeout']

export function classifyError(error: unknown): ErrorKind {
  if (error instanceof NotConfiguredError) return 'not-configured'
  const message = (error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error)).toLowerCase()
  if (message.includes('room_not_available') || message.includes('room not found')) return 'room-unavailable'
  if (NETWORK_HINTS.some((h) => message.includes(h))) return 'network'
  return 'other'
}

/** A short message the player can understand. */
export function describeError(error: unknown): string {
  switch (classifyError(error)) {
    case 'not-configured':
      return 'Multiplayer is not set up on this build.'
    case 'room-unavailable':
      return 'Room not found or already full.'
    case 'network':
      return 'Can’t reach the server. Check your connection and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
