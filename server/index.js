import express from 'express'
import cron from 'node-cron'
import { timingSafeEqual } from 'node:crypto'
import config from './config.js'
import { buildDiscordInteractionResponse } from './discord.js'
import { verifyDiscordRequest } from './discordInteractions.js'
import { getTitles } from './discordSuggestions.js'
import { buildAutocompleteResponse, getFocusedOption } from './discordRatings.js'
import { normalizeRaterKey, validateRating } from './ratings.js'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  buildWebhookPayload,
  sendDiscordWebhookNotification,
  validateNotificationSettings,
} from './discordWebhook.js'
import { getAnimesMeta, getSuggestionMeta } from './jikan.js'
import {
  upsertMedia,
  getByStatus,
  getByStatusCategory,
  getPendingOldest,
  getPendingOldestByCategory,
  getAllTitles,
  setStatus,
  markWatching,
  updateTitleStatus,
  clearMachine,
  TITLE_STATUSES,
  getWatchHistoryWithStats,
  getWatchStatsById,
  getRatingsForMedia,
  getRankings,
  searchWatchedTitles,
  upsertRating,
  getById,
  resetAll,
  backfillCategories,
  hasMediaItems,
  getAppSetting,
  setAppSetting,
  deleteMediaById,
  reshuffleActiveTitles,
  updateTitleCorrection,
} from './supabase.js'

const MACHINE_SIZE = 30
const CATEGORIES = ['anime', 'movie', 'series', 'all']

const app = express()
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key, x-signature-ed25519, x-signature-timestamp')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.post('/api/discord/interactions', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const validSignature = verifyDiscordRequest({
    body: req.body,
    signature: req.get('x-signature-ed25519'),
    timestamp: req.get('x-signature-timestamp'),
    publicKey: config.discordPublicKey,
  })
  if (!validSignature) return res.sendStatus(401)

  let interaction
  try {
    interaction = JSON.parse(req.body.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'El cuerpo de la interacción no es JSON válido.' })
  }

  if (interaction.type === 1) return res.json({ type: 1 })
  if (interaction.application_id !== config.discordClientId) return res.sendStatus(401)

  const commandName = interaction.data?.name
  const isSlashCommand = interaction.type === 2
    && ['sugerir', 'titulos', 'calificar', 'ranking', 'ayuda'].includes(commandName)
  const isRatingAutocomplete = interaction.type === 4 && commandName === 'calificar'
  const isTitlePageButton = interaction.type === 3
    && /^titles:(all|anime|movie|series):\d+$/.test(interaction.data?.custom_id || '')
  const isRankingPageButton = interaction.type === 3
    && /^ranking:(all|anime|movie|series):\d+$/.test(interaction.data?.custom_id || '')
  if ((!isSlashCommand && !isTitlePageButton && !isRankingPageButton && !isRatingAutocomplete) || typeof interaction.token !== 'string') {
    return res.status(400).json({ error: 'Interacción no compatible.' })
  }

  if (isRatingAutocomplete) {
    try {
      const { data, error } = await searchWatchedTitles(getFocusedOption(interaction), 25)
      if (error) throw new Error(error.message || String(error))
      return res.json(buildAutocompleteResponse(data || []))
    } catch (error) {
      console.error('[discord] No se pudo autocompletar el título:', error.message)
      return res.json({ type: 8, data: { choices: [] } })
    }
  }

  let callback
  try {
    callback = await buildDiscordInteractionResponse(interaction)
  } catch (error) {
    console.error('[discord] No se pudo completar la interacción:', error.message)
    callback = {
      type: 4,
      data: {
        content: '❌ No se pudo procesar el comando. Inténtalo de nuevo más tarde.',
        flags: 64,
      },
    }
  }
  return res.json(callback)
})

app.use(express.json())

async function syncDiscord() {
  const { data: mediaExists, error: mediaError } = await hasMediaItems()
  if (mediaError) throw new Error(`No se pudo comprobar si media_items tiene datos: ${mediaError.message}`)

  const {
    entries: titles,
    ignored,
    messagesRead,
    backfillComplete,
    restartedForEmptyMedia,
    nextState,
  } = await getTitles({ restartIfMediaEmpty: !mediaExists })
  const syncState = { ...nextState, hadMediaItems: Boolean(mediaExists) }
  if (!titles.length) {
    const { error } = await setAppSetting('discord_sync_state', syncState)
    if (error) throw new Error(`No se pudo guardar el cursor de Discord: ${error.message}`)
    return {
      added: 0,
      discarded: [],
      ignored,
      failed: [],
      messagesRead,
      backfillComplete,
      restartedForEmptyMedia,
    }
  }

  const { animes, discarded, failed } = await getAnimesMeta(titles)

  let added = 0
  if (animes.length) {
    const withMeta = animes.map((a) => ({ ...a, status: 'PENDING' }))
    const { added: inserted, error } = await upsertMedia(withMeta)
    if (error) throw new Error(`No se pudieron guardar los títulos sincronizados: ${error.message}`)
    added = inserted
    const { error: categoryError } = await backfillCategories(withMeta)
    if (categoryError) throw new Error(`No se pudieron completar categorías: ${categoryError.message}`)
  }

  if (!failed.length) {
    const { error: stateError } = await setAppSetting('discord_sync_state', {
      ...syncState,
      hadMediaItems: Boolean(mediaExists || added),
    })
    if (stateError) throw new Error(`No se pudo guardar el cursor de Discord: ${stateError.message}`)
  }
  for (const rejection of discarded) {
    console.info(`[sync] descartado "${rejection.title}": ${rejection.reason}${rejection.bestMatch ? ` Mejor resultado: "${rejection.bestMatch}" (${rejection.score.toFixed(2)}; mínimo ${rejection.threshold.toFixed(2)}).` : ''}`)
  }
  for (const failure of failed) {
    console.warn(`[sync] se reintentará "${failure.title}": ${failure.reason}`)
  }
  return { added, discarded, ignored, failed, messagesRead, backfillComplete, restartedForEmptyMedia }
}

function isAdmin(req, res, next) {
  const provided = req.headers['x-admin-key']
  const expected = config.adminSecretKey
  if (!expected) {
    return res.status(503).json({ error: 'ADMIN_SECRET_KEY no está configurada en el backend' })
  }
  const valid = typeof provided === 'string'
    && Buffer.byteLength(provided) === Buffer.byteLength(expected)
    && timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  if (!valid) return res.status(401).json({ error: 'Clave de administrador inválida' })
  next()
}

async function getNotificationSettings() {
  const { data, error } = await getAppSetting('discord_notification_settings')
  if (error) throw new Error(`No se pudo cargar la configuración de notificaciones: ${error.message}`)
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(data || {}) }
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
    if (!CATEGORIES.includes(raw)) {
      return res.status(400).json({ error: 'category debe ser anime, movie, series o todas' })
    }
    const category = raw === 'all' ? null : raw
    const { data, error } = await getByStatusCategory('IN_MACHINE', category)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ capsules: data, category })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

} // fin de las rutas de máquina

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

app.delete('/api/admin/titles/:id', isAdmin, async (req, res) => {
  try {
    const { data, error } = await deleteMediaById(req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'El título no existe o ya fue eliminado.' })
    res.json({ ok: true, id: data.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/titles/:id/correction', isAdmin, async (req, res) => {
  const { category } = req.body || {}
  const queryTitle = typeof req.body?.queryTitle === 'string'
    ? req.body.queryTitle.trim()
    : ''
  const year = req.body?.year ?? null
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category debe ser uno de: ${CATEGORIES.join(', ')}` })
  }
  if (queryTitle.length > 200) {
    return res.status(400).json({ error: 'queryTitle no puede superar 200 caracteres.' })
  }
  if (year !== null
    && (!Number.isInteger(year) || year < 1870 || year > new Date().getFullYear() + 5)) {
    return res.status(400).json({ error: 'year debe ser un año válido entre 1870 y cinco años en el futuro.' })
  }

  try {
    const { data: existing, error: lookupError } = await getById(req.params.id)
    if (lookupError) return res.status(500).json({ error: lookupError.message })
    if (!existing) return res.status(404).json({ error: 'El título no existe.' })

    const meta = await getSuggestionMeta(queryTitle || existing.title, category, year)
    const { data, error } = await updateTitleCorrection(req.params.id, category, meta)
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'El título ya no existe.' })
    res.json({
      ok: true,
      title: meta?.title || existing.title,
      category,
      metadataUpdated: Boolean(meta),
    })
  } catch (err) {
    res.status(502).json({ error: `No se pudo corregir el título: ${err.message}` })
  }
})

app.post('/api/admin/titles/reshuffle', isAdmin, async (req, res) => {
  const raw = String(req.body?.category || '').toLowerCase()
  if (raw !== 'all' && !CATEGORIES.slice(0, 3).includes(raw)) {
    return res.status(400).json({ error: 'category debe ser anime, movie, series o todas' })
  }
  const category = raw === 'all' ? null : raw
  try {
    const { data, error } = await reshuffleActiveTitles(MACHINE_SIZE, category)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true, ...data, category: raw, preservedWatched: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/titles/:id/status', isAdmin, async (req, res) => {
  const status = String(req.body?.status || '').toUpperCase()
  if (!TITLE_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status debe ser uno de: ${TITLE_STATUSES.join(', ')}` })
  }
  try {
    const { data, error } = await updateTitleStatus(req.params.id, status)
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'El título no existe.' })
    res.json({ ok: true, title: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/machines/clear', isAdmin, async (req, res) => {
  const raw = String(req.body?.category || '').toLowerCase()
  if (raw !== 'all' && !CATEGORIES.slice(0, 3).includes(raw)) {
    return res.status(400).json({ error: 'category debe ser anime, movie, series o todas' })
  }
  const category = raw === 'all' ? null : raw
  try {
    const { data, error } = await clearMachine(category)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true, category: raw, ...data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/machines/mix', isAdmin, async (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') {
    return res.status(400).json({ error: 'El campo enabled debe ser booleano' })
  }
  try {
    const { error } = await setMixMachineEnabled(req.body.enabled)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true, enabled: req.body.enabled })
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

    const { error: updErr } = await markWatching([id])
    if (updErr) return res.status(500).json({ error: updErr.message })

    // Notificar por webhook de Discord (no-bloqueante; si falla no rompe la respuesta)
    let notificationSettings = null
    try {
      notificationSettings = await getNotificationSettings()
    } catch (err) {
      console.error('[webhook] no se pudo cargar su configuración:', err.message)
    }
    if (notificationSettings?.enabled) {
      sendDiscordWebhookNotification({
        ...consumed,
        category: consumed.category || null,
        status: 'WATCHING',
      }, notificationSettings).catch((err) => console.error('[webhook] error inesperado:', err.message))
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

    res.json({ consumed: { ...consumed, status: 'WATCHING' }, next })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const { data, error } = await getWatchHistoryWithStats(limit)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ history: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/rankings', async (req, res) => {
  try {
    const raw = String(req.query.category || '').toLowerCase()
    const category = CATEGORIES.includes(raw) ? raw : null
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
    const { data, error } = await getRankings(category, limit)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ rankings: data, category: category || 'all' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/ratings/:mediaId', async (req, res) => {
  try {
    const { data: ratings, error } = await getRatingsForMedia(req.params.mediaId)
    if (error) return res.status(500).json({ error: error.message })
    const { data: stats, error: statsError } = await getWatchStatsById(req.params.mediaId)
    if (statsError) return res.status(500).json({ error: statsError.message })

    const raterKey = normalizeRaterKey(req.query.raterName)
    const mine = raterKey
      ? (ratings || []).find((rating) => rating.raterKey === raterKey) || null
      : null
    res.json({
      ratings: (ratings || []).map((rating) => ({
        id: rating.id,
        raterName: rating.raterName,
        source: rating.source,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      })),
      summary: {
        mediaId: req.params.mediaId,
        averageScore: stats?.averageScore || 0,
        ratingCount: stats?.ratingCount || 0,
      },
      mine: mine
        ? { score: mine.score, comment: mine.comment, updatedAt: mine.updatedAt }
        : null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/ratings', async (req, res) => {
  const { mediaId } = req.body || {}
  if (typeof mediaId !== 'string' || !mediaId.trim()) {
    return res.status(400).json({ error: 'mediaId es obligatorio.' })
  }

  const validation = validateRating({
    score: req.body?.score,
    comment: req.body?.comment,
    raterName: req.body?.raterName,
    source: 'web',
  })
  if (validation.error) return res.status(400).json({ error: validation.error })

  try {
    const { data: media, error: mediaError } = await getById(mediaId)
    if (mediaError) return res.status(500).json({ error: mediaError.message })
    if (!media) return res.status(404).json({ error: 'La obra no existe.' })
    if (media.status !== 'WATCHED') {
      return res.status(409).json({ error: 'Solo se pueden calificar obras marcadas como vistas.' })
    }

    const { data: existing, error: existingError } = await getRatingsForMedia(mediaId)
    if (existingError) return res.status(500).json({ error: existingError.message })
    const previous = (existing || []).find((rating) => rating.raterKey === validation.value.raterKey)

    const { data: saved, error: saveError } = await upsertRating({
      mediaId,
      raterKey: validation.value.raterKey,
      raterName: validation.value.raterName,
      source: 'web',
      score: validation.value.score,
      comment: validation.value.comment,
    })
    if (saveError) return res.status(500).json({ error: saveError.message })
    if (!saved) return res.status(500).json({ error: 'No se pudo confirmar la calificación guardada.' })

    const { data: stats, error: statsError } = await getWatchStatsById(mediaId)
    if (statsError) return res.status(500).json({ error: statsError.message })

    res.json({
      rating: {
        score: saved.score,
        comment: saved.comment,
        updatedAt: saved.updatedAt,
      },
      summary: {
        mediaId,
        averageScore: stats?.averageScore || 0,
        ratingCount: stats?.ratingCount || 0,
      },
      updated: Boolean(previous),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/sync-discord', isAdmin, async (req, res) => {
  try {
    const result = await syncDiscord()
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/notifications', isAdmin, async (req, res) => {
  try {
    const settings = await getNotificationSettings()
    res.json({ enabled: settings.enabled, settings })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

app.post('/api/admin/notifications/settings', isAdmin, async (req, res) => {
  const validation = validateNotificationSettings(req.body)
  if (validation.error) return res.status(400).json({ error: validation.error })
  try {
    const { data: current, error: loadError } = await getAppSetting('discord_notification_settings')
    if (loadError) throw new Error(loadError.message)
    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(current || {}),
      ...validation.settings,
    }
    const { error } = await setAppSetting('discord_notification_settings', settings)
    if (error) throw new Error(error.message)
    res.json({ settings })
  } catch (err) {
    res.status(503).json({ error: `No se pudo guardar la configuración: ${err.message}` })
  }
})

app.post('/api/admin/notifications/toggle', isAdmin, async (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') {
    return res.status(400).json({ error: 'El campo enabled debe ser booleano' })
  }
  try {
    const { data: current, error: loadError } = await getAppSetting('discord_notification_settings')
    if (loadError) throw new Error(loadError.message)
    const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(current || {}), enabled: req.body.enabled }
    const { error } = await setAppSetting('discord_notification_settings', settings)
    if (error) throw new Error(error.message)
    res.json({ enabled: settings.enabled })
  } catch (err) {
    res.status(503).json({ error: `No se pudo guardar el estado del webhook: ${err.message}` })
  }
})

app.post('/api/admin/notifications/preview', isAdmin, (req, res) => {
  const validation = validateNotificationSettings(req.body)
  if (validation.error) return res.status(400).json({ error: validation.error })
  try {
    const payload = buildWebhookPayload({
      title: 'Título de ejemplo',
      category: 'series',
      synopsis: 'Sinopsis de ejemplo para previsualizar el formato.',
      suggested_by: 'Usuario de ejemplo',
      image: null,
    }, validation.settings)
    res.json({ payload })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/admin/notifications/test', isAdmin, async (req, res) => {
  const validation = validateNotificationSettings(req.body)
  if (validation.error) return res.status(400).json({ error: validation.error })
  try {
    await sendDiscordWebhookNotification({
      title: 'Prueba de notificación',
      category: 'series',
      synopsis: 'Esta es una prueba de tu plantilla de notificaciones.',
      suggested_by: 'Wotakoi-Catcher',
      image: null,
    }, validation.settings)
    res.json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: `No se pudo enviar la prueba: ${err.message}` })
  }
})

app.post('/api/admin/reset', isAdmin, async (req, res) => {
  try {
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
  syncDiscord()
    .then((r) => console.log(`[sync] ${r.added} obras nuevas; ${r.messagesRead} mensajes leídos; ${r.discarded.length} descartadas por TMDB; ${r.ignored.length} líneas omitidas; ${r.failed.length} errores; historial ${r.backfillComplete ? 'completo' : 'pendiente'}`))
    .catch((err) => console.error('[sync] error inicial:', err.message))

  if (config.refreshIntervalMin > 0) {
    cron.schedule(`*/${config.refreshIntervalMin} * * * *`, () => {
      syncDiscord()
        .then((r) => console.log(`[sync] cron: ${r.added} obras nuevas; ${r.messagesRead} mensajes leídos; ${r.discarded.length} descartadas por TMDB; ${r.ignored.length} líneas omitidas; ${r.failed.length} errores; historial ${r.backfillComplete ? 'completo' : 'pendiente'}`))
        .catch((err) => console.error('[sync] error cron:', err.message))
    })
    console.log(`Auto-refresco cada ${config.refreshIntervalMin} min`)
  }
})