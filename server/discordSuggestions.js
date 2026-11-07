import config from './config.js'
import { getAppSetting } from './supabase.js'
import { extractSuggestionEntries } from './suggestionParser.js'

const DISCORD_API = 'https://discord.com/api/v10'
const SYNC_STATE_KEY = 'discord_sync_state'

export function shouldRestartForEmptyMedia(savedState, mediaExists) {
  return !mediaExists
    && Boolean(savedState?.latestMessageId)
    && savedState.hadMediaItems !== false
}

function compareMessageIds(a, b) {
  const left = BigInt(a.id)
  const right = BigInt(b.id)
  return left < right ? -1 : left > right ? 1 : 0
}

async function fetchMessagePage({ before, after } = {}) {
  if (!config.discordToken || !config.discordChannelId) {
    throw new Error('Faltan DISCORD_TOKEN o DISCORD_CHANNEL_ID en server/.env')
  }

  const limit = Math.max(1, Math.min(Number(config.discordLimit) || 100, 100))
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  if (after) params.set('after', after)

  const response = await fetch(
    `${DISCORD_API}/channels/${config.discordChannelId}/messages?${params}`,
    {
      headers: { Authorization: `Bot ${config.discordToken}` },
      signal: AbortSignal.timeout(15000),
    },
  )
  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status} ${response.statusText}`)
  }

  const messages = await response.json()
  if (!Array.isArray(messages)) throw new Error('Discord devolvió una respuesta de mensajes inválida')
  return messages.sort(compareMessageIds)
}

export async function getTitles({ restartIfMediaEmpty = false } = {}) {
  const { data: savedState, error } = await getAppSetting(SYNC_STATE_KEY)
  if (error) throw new Error(`No se pudo leer el cursor de Discord: ${error.message}`)

  const pageSize = Math.max(1, Math.min(Number(config.discordLimit) || 100, 100))
  const maxPages = Math.max(1, Math.min(Number(config.discordSyncMaxPages) || 3, 20))
  const shouldRestart = restartIfMediaEmpty && shouldRestartForEmptyMedia(savedState, false)
  const state = savedState && !shouldRestart
    ? { ...savedState }
    : { latestMessageId: null, backfillBeforeId: null, backfillComplete: false }
  const collected = []

  if (!state.latestMessageId) {
    const firstPage = await fetchMessagePage()
    collected.push(...firstPage)
    if (firstPage.length) {
      state.latestMessageId = firstPage[firstPage.length - 1].id
      state.backfillBeforeId = firstPage[0].id
    } else {
      state.backfillComplete = true
    }
    state.backfillComplete = firstPage.length < pageSize
    let pagesUsed = firstPage.length ? 1 : 0
    while (!state.backfillComplete && state.backfillBeforeId && pagesUsed < maxPages) {
      const messages = await fetchMessagePage({ before: state.backfillBeforeId })
      pagesUsed++
      if (!messages.length) {
        state.backfillComplete = true
        break
      }
      collected.push(...messages)
      state.backfillBeforeId = messages[0].id
      if (messages.length < pageSize) state.backfillComplete = true
    }
  } else {
    let after = state.latestMessageId
    let pagesUsed = 0
    for (let page = 0; page < maxPages; page++) {
      const messages = await fetchMessagePage({ after })
      if (!messages.length) break
      pagesUsed++
      collected.push(...messages)
      after = messages[messages.length - 1].id
      state.latestMessageId = after
      if (messages.length < pageSize) break
    }

    while (!state.backfillComplete && state.backfillBeforeId && pagesUsed < maxPages) {
      const messages = await fetchMessagePage({ before: state.backfillBeforeId })
      pagesUsed++
      if (!messages.length) {
        state.backfillComplete = true
        break
      }
      collected.push(...messages)
      state.backfillBeforeId = messages[0].id
      if (messages.length < pageSize) state.backfillComplete = true
    }
  }

  const uniqueMessages = [...new Map(collected.map((message) => [message.id, message])).values()]
  const parsed = extractSuggestionEntries(uniqueMessages)
  return {
    entries: parsed.entries,
    ignored: parsed.ignored,
    messagesRead: uniqueMessages.length,
    backfillComplete: state.backfillComplete,
    restartedForEmptyMedia: Boolean(shouldRestart),
    nextState: state,
  }
}
