import test from 'node:test'
import assert from 'node:assert/strict'
import { patchOriginalInteractionResponse } from './discordInteractionResponse.js'

function okResponse() {
  return { ok: true, status: 200, statusText: 'OK' }
}

function rateLimitedResponse(retryAfter = 0.25) {
  return {
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    headers: { get: () => null },
    text: async () => JSON.stringify({
      message: 'You are being rate limited.',
      retry_after: retryAfter,
      global: false,
    }),
  }
}

test('actualiza la respuesta original sin reintentos cuando Discord acepta', async () => {
  const calls = []
  const result = await patchOriginalInteractionResponse({
    applicationId: 'app',
    token: 'token',
    response: { content: 'ok' },
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return okResponse()
    },
  })

  assert.equal(result.status, 200)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://discord.com/api/v10/webhooks/app/token/messages/@original')
  assert.equal(calls[0].options.method, 'PATCH')
  assert.equal(calls[0].options.body, JSON.stringify({ content: 'ok' }))
})

test('reintenta respetando retry_after cuando Discord responde 429', async () => {
  const waits = []
  let attempts = 0
  const result = await patchOriginalInteractionResponse({
    applicationId: 'app',
    token: 'token',
    response: { content: 'ok' },
    fetchImpl: async () => {
      attempts += 1
      return attempts === 1 ? rateLimitedResponse(0.25) : okResponse()
    },
    sleep: async (ms) => { waits.push(ms) },
  })

  assert.equal(result.status, 200)
  assert.equal(attempts, 2)
  assert.deepEqual(waits, [250])
})

test('usa el header Retry-After cuando está presente', async () => {
  const waits = []
  let attempts = 0
  await patchOriginalInteractionResponse({
    applicationId: 'app',
    token: 'token',
    response: { content: 'ok' },
    fetchImpl: async () => {
      attempts += 1
      if (attempts > 1) return okResponse()
      return {
        ...rateLimitedResponse(5),
        headers: { get: (name) => (name.toLowerCase() === 'retry-after' ? '0.5' : null) },
      }
    },
    sleep: async (ms) => { waits.push(ms) },
  })

  assert.deepEqual(waits, [500])
})

test('falla con el detalle de Discord tras agotar los reintentos', async () => {
  let attempts = 0
  await assert.rejects(
    patchOriginalInteractionResponse({
      applicationId: 'app',
      token: 'token',
      response: { content: 'ok' },
      fetchImpl: async () => {
        attempts += 1
        return rateLimitedResponse(0)
      },
      sleep: async () => {},
    }),
    /429 Too Many Requests.*rate limited/,
  )
  assert.equal(attempts, 5)
})

test('rechaza interacciones sin application id o token', async () => {
  await assert.rejects(
    patchOriginalInteractionResponse({ token: 'token', response: {} }),
    /application id/,
  )
})
