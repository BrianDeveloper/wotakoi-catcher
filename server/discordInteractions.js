import { createPublicKey, verify as verifySignature } from 'node:crypto'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
const MAX_SIGNATURE_AGE_SECONDS = 300

export function verifyDiscordRequest({
  body,
  signature,
  timestamp,
  publicKey,
  now = Date.now(),
}) {
  if (!Buffer.isBuffer(body)
    || !/^[\da-f]{128}$/i.test(signature || '')
    || !/^[\da-f]{64}$/i.test(publicKey || '')
    || !timestamp) {
    return false
  }

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)
    || Math.abs(now / 1000 - timestampSeconds) > MAX_SIGNATURE_AGE_SECONDS) {
    return false
  }

  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey, 'hex')]),
      format: 'der',
      type: 'spki',
    })
    return verifySignature(
      null,
      Buffer.concat([Buffer.from(timestamp), body]),
      key,
      Buffer.from(signature, 'hex'),
    )
  } catch {
    return false
  }
}
