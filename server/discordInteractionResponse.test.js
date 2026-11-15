import test from 'node:test'
import assert from 'node:assert/strict'
import { patchOriginalInteractionResponse } from './discordInteractionResponse.js'

test('edita la respuesta original con el cliente REST de discord.js', async () => {
  const calls = []
  const rest = {
    patch: async (route, options) => {
      calls.push({ route, options })
      return { id: 'message-1' }
    },
  }

  const result = await patchOriginalInteractionResponse({
    applicationId: 'app',
    token: 'token',
    response: { content: 'ok' },
    authToken: 'bot-token',
    rest,
  })

  assert.deepEqual(result, { id: 'message-1' })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].route, '/webhooks/app/token/messages/%40original')
  assert.equal(calls[0].options.auth, true)
  assert.deepEqual(calls[0].options.body, { content: 'ok' })
})

test('envía la petición sin autenticación cuando no hay token del bot', async () => {
  const calls = []
  const rest = {
    patch: async (route, options) => {
      calls.push({ route, options })
      return { id: 'message-1' }
    },
  }

  await patchOriginalInteractionResponse({
    applicationId: 'app',
    token: 'token',
    response: { content: 'ok' },
    rest,
  })

  assert.equal(calls[0].options.auth, false)
})

test('rechaza interacciones sin application id o token', async () => {
  await assert.rejects(
    patchOriginalInteractionResponse({ token: 'token', response: {}, rest: {} }),
    /application id/,
  )
  await assert.rejects(
    patchOriginalInteractionResponse({ applicationId: 'app', response: {}, rest: {} }),
    /token/,
  )
})

test('propaga el error del cliente REST', async () => {
  const rest = {
    patch: async () => {
      throw new Error('Discord no aceptó la respuesta: 429 Too Many Requests')
    },
  }

  await assert.rejects(
    patchOriginalInteractionResponse({
      applicationId: 'app',
      token: 'token',
      response: { content: 'ok' },
      rest,
    }),
    /429 Too Many Requests/,
  )
})
