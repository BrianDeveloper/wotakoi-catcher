import config from './config.js'

const DISCORD_API = 'https://discord.com/api/v10'

async function fetchMessages(limit = config.discordLimit) {
  if (!config.discordToken || !config.discordChannelId) {
    throw new Error('Faltan DISCORD_TOKEN o DISCORD_CHANNEL_ID en server/.env')
  }

  const url = `${DISCORD_API}/channels/${config.discordChannelId}/messages?limit=${limit}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${config.discordToken}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Discord API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

function normalizeTitle(raw) {
  return raw
    .replace(/[*_`~]/g, '')
    .replace(/^[\s#>-]+/, '')
    .trim()
}

function extractTitles(messages) {
  const seen = new Set()
  const titles = []

  for (const msg of messages) {
    const lines = (msg.content || '').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('#') || trimmed.startsWith('!')) continue

      const title = normalizeTitle(trimmed)
      if (!title || title.length < 2) continue

      const key = title.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      titles.push(title)
    }
  }

  return titles
}

export async function getTitles() {
  const messages = await fetchMessages()
  return extractTitles(messages)
}
