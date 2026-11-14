const DISCORD_API = 'https://discord.com/api/v10'
const MAX_ATTEMPTS = 5
const MAX_RETRY_AFTER_MS = 60000
const DEFAULT_RETRY_AFTER_MS = 1000

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readErrorBody(result) {
  try {
    const text = await result.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text.slice(0, 500)
    }
  } catch {
    return null
  }
}

function getRetryAfterMs(result, body) {
  const headerValue = Number(result.headers?.get?.('retry-after'))
  const bodyValue = body && typeof body === 'object' ? Number(body.retry_after) : NaN
  const seconds = Number.isFinite(headerValue) && headerValue > 0 ? headerValue : bodyValue
  if (!Number.isFinite(seconds) || seconds < 0) return DEFAULT_RETRY_AFTER_MS
  return Math.min(MAX_RETRY_AFTER_MS, Math.max(250, Math.ceil(seconds * 1000)))
}

function describeFailure(result, body) {
  const detail = typeof body === 'string'
    ? body
    : body?.message || (body ? JSON.stringify(body) : '')
  return `Discord no aceptó la respuesta: ${result.status} ${result.statusText}${detail ? ` — ${detail}` : ''}`
}

export async function patchOriginalInteractionResponse({
  applicationId,
  token,
  response,
  fetchImpl = fetch,
  sleep = defaultSleep,
}) {
  if (!applicationId || !token) {
    throw new Error('Faltan el application id o el token de la interacción.')
  }

  const url = `${DISCORD_API}/webhooks/${applicationId}/${token}/messages/@original`
  let lastError = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let result
    try {
      result = await fetchImpl(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
        signal: AbortSignal.timeout(10000),
      })
    } catch (error) {
      lastError = error
      if (attempt >= MAX_ATTEMPTS) break
      await sleep(DEFAULT_RETRY_AFTER_MS * attempt)
      continue
    }

    if (result.ok) return result

    const body = await readErrorBody(result)
    if (result.status === 429 && attempt < MAX_ATTEMPTS) {
      await sleep(getRetryAfterMs(result, body))
      continue
    }

    lastError = new Error(describeFailure(result, body))
    if (result.status >= 500 && attempt < MAX_ATTEMPTS) {
      await sleep(DEFAULT_RETRY_AFTER_MS * attempt)
      continue
    }
    break
  }

  throw lastError || new Error('Discord no aceptó la respuesta.')
}
