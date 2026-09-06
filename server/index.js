import express from 'express'
import cron from 'node-cron'
import config from './config.js'
import { getTitles, startBot } from './discord.js'
import { sendDiscordWebhookNotification } from './discordWebhook.js'
import { getAnimesMeta } from './jikan.js'
import {
  upsertMedia,
  getByStatus,
  getByStatusCategory,
  getPendingOldest,
  getPendingOldestByCategory,
  getAllTitles,
  setStatus,
  setConsumed,
  getConsumedHistory,
  getById,
  resetAll,
  updateCategory,
} from './supabase.js'

const MACHINE_SIZE = 30
const CATEGORIES = ['anime', 'movie', 'series']

// Enviar notificación al canal de anuncios al sacar un premio (togglable en runtime)
let webhookEnabled = true

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key')
  next()
})

async function syncDiscord() {
  const titles = await getTitles()
  if (!titles.length) return { added: 0 }

  // upsert con ignoreDuplicates: true → no sobrescribe status de existentes
  const { animes, discarded } = await getAnimesMeta(titles)
  if (!animes.length) return { added: 0 }

  // Backfill de categoría en filas existentes que aún no la tienen
  let categoryBackfilled = 0
  for (const a of animes) {
    const { error } = await updateCategory(a.id, a.category)
    if (error) categoryBackfilled++
  }

  const withMeta = animes.map((a) => ({ ...a, status: 'PENDING' }))
  const { error } = await upsertMedia(withMeta)
  if (error) console.warn('[sync] upsert error:', error.message)
  return { added: withMeta.length, discarded: discarded.length, categoryBackfilled }
}

async function fillCurrent(category) {
  const inCategory = (cat) =>
    cat
      ? getByStatusCategory('IN_MACHINE', cat)
      : getByStatus('IN_MACHINE')

  let { data, error } = await inCategory(category)
  if (error) return { error }

  if (data.length < MACHINE_SIZE) {
    const missing = MACHINE_SIZE - data.length
    const { data: pending, error: pendErr } = category
      ? await getPendingOldestByCategory(missing, category)
      : await getPendingOldest(missing)
    if (pendErr) return { error: pendErr.message }
    if (pending.length) {
      const ids = pending.map((p) => p.id)
      const { error: updErr } = await setStatus(ids, 'IN_MACHINE')
      if (updErr) return { error: updErr.message }
      data = [
        ...data,
        ...pending.map((p) => ({ ...p, status: 'IN_MACHINE' })),
      ]
    }
  }

  return { data }
}

app.get('/api/machine/capsules', async (req, res) => {
  try {
    const raw = String(req.query.category || '').toLowerCase()
    const category = CATEGORIES.includes(raw) ? raw : null
    const { data, error } = await fillCurrent(category)
    if (error) return res.status(500).json({ error })
    res.json({ capsules: data, category: category || 'mix' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Alias sin filtro (Mix) para compatibilidad
app.get('/api/capsules', async (req, res) => {
  try {
    const { data, error } = await fillCurrent(null)
    if (error) return res.status(500).json({ error })
    res.json({ capsules: data, category: 'mix' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/titles', async (req, res) => {
  try {
    const raw = String(req.query.category || '').toLowerCase()
    const category = CATEGORIES.includes(raw) ? raw : null
    const { data, error } = await getAllTitles(category)
    if (error) return res.status(500).json({ error })
    res.json({ titles: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/capsules/:id/consume', async (req, res) => {
  try {
    const { id } = req.params
    const { data: consumed, error: getErr } = await getById(id)
    if (getErr) return res.status(500).json({ error: getErr.message })
    if (!consumed) return res.status(404).json({ error: 'Cápsula no encontrada' })

    const { error: updErr } = await setConsumed([id])
    if (updErr) return res.status(500).json({ error: updErr.message })

    // Notificar por webhook de Discord (no-bloqueante; si falla no rompe la respuesta)
    if (webhookEnabled) {
      sendDiscordWebhookNotification({
        ...consumed,
        category: consumed.category || null,
        status: 'WATCHED',
      }).catch((err) => console.error('[webhook] error inesperado:', err.message))
    }

    // Rellenar la máquina con el siguiente PENDING más antiguo de la misma categoría
    let next = null
    const category = consumed.category || null
    const { data: pending, error: pendErr } = category
      ? await getPendingOldestByCategory(1, category)
      : await getPendingOldest(1)
    if (pendErr) return res.status(500).json({ error: pendErr.message })
    if (pending.length) {
      await setStatus([pending[0].id], 'IN_MACHINE')
      next = { ...pending[0], status: 'IN_MACHINE' }
    }

    res.json({ consumed: { ...consumed, status: 'WATCHED' }, next })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const { data, error } = await getConsumedHistory(limit)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ history: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/sync-discord', async (req, res) => {
  try {
    const { added } = await syncDiscord()
    res.json({ ok: true, added })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/webhook/status', (req, res) => {
  const key = req.headers['x-admin-key'] || (req.query && req.query.key)
  if (!config.adminSecretKey || key !== config.adminSecretKey) {
    return res.status(401).json({ error: 'Clave de administrador inválida' })
  }
  res.json({ enabled: webhookEnabled })
})

app.post('/api/admin/webhook/toggle', (req, res) => {
  const key = req.headers['x-admin-key'] || (req.body && req.body.key)
  if (!config.adminSecretKey || key !== config.adminSecretKey) {
    return res.status(401).json({ error: 'Clave de administrador inválida' })
  }
  const desired = req.body && typeof req.body.enabled === 'boolean'
    ? req.body.enabled
    : !webhookEnabled
  webhookEnabled = desired
  console.log(`[webhook] Envío de notificaciones: ${webhookEnabled ? 'ACTIVADO' : 'DESACTIVADO'}`)
  res.json({ ok: true, enabled: webhookEnabled })
})

app.post('/api/admin/reset', async (req, res) => {
  try {
    const key = req.headers['x-admin-key'] || (req.body && req.body.key)
    if (!config.adminSecretKey || key !== config.adminSecretKey) {
      return res.status(401).json({ error: 'Clave de administrador inválida' })
    }
    const { error } = await resetAll()
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  startBot()
  syncDiscord()
    .then((r) => console.log(`[sync] ${r.added} obras nuevas desde Discord`))
    .catch((err) => console.error('[sync] error inicial:', err.message))

  if (config.refreshIntervalMin > 0) {
    cron.schedule(`*/${config.refreshIntervalMin} * * * *`, () => {
      syncDiscord()
        .then((r) => console.log(`[sync] cron: ${r.added} obras nuevas`))
        .catch((err) => console.error('[sync] error cron:', err.message))
    })
    console.log(`Auto-refresco cada ${config.refreshIntervalMin} min`)
  }
})