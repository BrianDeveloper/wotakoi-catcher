import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldRestartForEmptyMedia } from './discordSuggestions.js'

test('restarts an existing Discord cursor if media was cleared after a populated sync', () => {
  assert.equal(shouldRestartForEmptyMedia({
    latestMessageId: '12345',
    hadMediaItems: true,
  }, false), true)
})

test('does not repeatedly restart a cursor when a scan has not imported any media', () => {
  assert.equal(shouldRestartForEmptyMedia({
    latestMessageId: '12345',
    hadMediaItems: false,
  }, false), false)
})

test('does not restart a cursor while the media table still contains data', () => {
  assert.equal(shouldRestartForEmptyMedia({
    latestMessageId: '12345',
    hadMediaItems: true,
  }, true), false)
})
