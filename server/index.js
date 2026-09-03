import express from 'express'
import cron from 'node-cron'
import config from './config.js'
import { getTitles } from './discord.js'
import { getAnimesMeta } from './jikan.js'
import { getAnimes, getLastUpdated, setAnimes, loadCache, getDiscarded, addDiscarded } from './cache.js'

const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  next()
})

app.get('/api/animes', (req, res) => {
  res.json({
    animes: getAnimes(),
    lastUpdated: getLastUpdated()?.toISOString() ?? null,
  })
})

function normalizeTitle(title) {
  return String(title || '').toLowerCase().trim()
}

async function refresh() {
  try {
    const titles = await getTitles()
    const cached = getAnimes()
    const discKey = new Set(getDiscarded().map(normalizeTitle))
    const cachedKeys = new Set(cached.map((a) => normalizeTitle(a.title)))

    const missing = titles.filter(
      (t) => !cachedKeys.has(normalizeTitle(t)) && !discKey.has(normalizeTitle(t))
    )
    const keep = cached.filter((a) =>
      titles.some((t) => normalizeTitle(t) === normalizeTitle(a.title))
    )

    if (missing.length > 0) {
      console.log(`[refresh] ${missing.length} títulos nuevos a enriquecer`)
      const { animes, discarded } = await getAnimesMeta(missing)
      setAnimes([...keep, ...animes])
      addDiscarded(discarded)
    } else {
      console.log(`[refresh] sin títulos nuevos (${keep.length} en caché)`)
    }
  } catch (err) {
    console.error('[refresh] error:', err.message)
  }
}

app.get('/api/refresh', async (req, res) => {
  await refresh()
  res.json({ ok: true, animes: getAnimes() })
})

loadCache()

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  refresh()

  if (config.refreshIntervalMin > 0) {
    cron.schedule(`*/${config.refreshIntervalMin} * * * *`, refresh)
    console.log(`Auto-refresco cada ${config.refreshIntervalMin} min`)
  }
})
