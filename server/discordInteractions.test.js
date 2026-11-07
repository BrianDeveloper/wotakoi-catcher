import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { verifyDiscordRequest } from './discordInteractions.js'

const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')

function signedRequest(body, timestamp) {
  const signature = sign(
    null,
    Buffer.concat([Buffer.from(timestamp), body]),
    privateKey,
  ).toString('hex')
  return { signature, timestamp }
}

test('verifies a Discord Ed25519 signature over the exact raw request body', () => {
  const body = Buffer.from('{"type":1}')
  const timestamp = String(Math.floor(Date.now() / 1000))
  const { signature } = signedRequest(body, timestamp)

  assert.equal(verifyDiscordRequest({
    body,
    signature,
    timestamp,
    publicKey: publicKeyHex,
  }), true)
  assert.equal(verifyDiscordRequest({
    body: Buffer.from('{"type":2}'),
    signature,
    timestamp,
    publicKey: publicKeyHex,
  }), false)
})

test('rejects malformed or stale Discord signatures', () => {
  const body = Buffer.from('{"type":1}')
  const timestamp = String(Math.floor(Date.now() / 1000) - 301)
  const { signature } = signedRequest(body, timestamp)

  assert.equal(verifyDiscordRequest({
    body,
    signature,
    timestamp,
    publicKey: publicKeyHex,
  }), false)
  assert.equal(verifyDiscordRequest({
    body,
    signature: 'invalid',
    timestamp,
    publicKey: publicKeyHex,
  }), false)
})
