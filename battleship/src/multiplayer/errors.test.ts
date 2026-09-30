import { describe, expect, it } from 'vitest'
import { NotConfiguredError } from './client'
import { classifyError, describeError } from './errors'

describe('classifyError', () => {
  it('recognises the main failure kinds', () => {
    expect(classifyError(new NotConfiguredError())).toBe('not-configured')
    expect(classifyError(new Error('Room not found or already full'))).toBe('room-unavailable')
    expect(classifyError({ message: 'room_not_available' })).toBe('room-unavailable')
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('network')
    expect(classifyError(new Error('boom'))).toBe('other')
  })

  it('gives every kind a readable message', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toMatch(/connection/i)
    expect(describeError(new Error('room_not_available'))).toMatch(/not found or already full/i)
  })
})
