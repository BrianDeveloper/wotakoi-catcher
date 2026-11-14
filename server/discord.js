import config from './config.js'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import {
  getAllTitlesPage,
  getById,
  getRankings,
  getRatingsForMedia,
  getWatchStatsById,
  insertSuggestion,
  searchWatchedTitles,
  updateMeta,
  upsertRating,
} from './supabase.js'
import {
  RANKING_LIMIT,
  validateRating,
} from './ratings.js'
import {
  buildRankingResponse,
  buildRatingResponse,
  calificarCommand,
  rankingCommand,
} from './discordRatings.js'
import { getSuggestionMeta } from './jikan.js'
import { extractSuggestionEntries } from './suggestionParser.js'
import { createTitleListResponse, TITLE_LIST_PAGE_SIZE } from './discordTitleList.js'

const CATEGORY_META = {
  anime: { emoji: '🍥', label: 'Anime' },
  movie: { emoji: '🎬', label: 'Película' },
  series: { emoji: '📺', label: 'Serie' },
}

export const suggestionCommand = new SlashCommandBuilder()
  .setName('sugerir')
  .setDescription('Envía y categoriza una sugerencia de contenido para la máquina')
  .addStringOption((option) =>
    option.setName('titulo').setDescription('Nombre exacto de la obra').setRequired(true))
  .addStringOption((option) =>
    option.setName('categoria')
      .setDescription('Categoría de la obra')
      .setRequired(true)
      .addChoices(
        { name: 'Anime', value: 'anime' },
        { name: 'Película', value: 'movie' },
        { name: 'Serie', value: 'series' }))

export const titlesCommand = new SlashCommandBuilder()
  .setName('titulos')
  .setDescription('Consulta los títulos registrados en la máquina')
  .addStringOption((option) =>
    option.setName('categoria')
        .setDescription('Filtra por categoría')
        .setRequired(false)
        .addChoices(
          { name: 'Todas', value: 'all' },
          { name: 'Anime', value: 'anime' },
          { name: 'Película', value: 'movie' },
          { name: 'Serie', value: 'series' }))

export async function getTitles() {
  if (!config.discordToken || !config.discordChannelId) {
    throw new Error('Faltan DISCORD_TOKEN o DISCORD_CHANNEL_ID en server/.env')
  }

  const limit = Math.max(1, Math.min(Number(config.discordLimit) || 100, 100))
  const response = await fetch(
    `https://discord.com/api/v10/channels/${config.discordChannelId}/messages?limit=${limit}`,
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
  return extractSuggestionEntries(messages).entries
}

export async function registerDiscordCommands() {
  const missing = [
    ['DISCORD_TOKEN', config.discordToken],
    ['DISCORD_CLIENT_ID', config.discordClientId],
    ['DISCORD_GUILD_ID', config.discordGuildId],
  ].filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) {
    throw new Error(`Faltan variables para registrar el comando: ${missing.join(', ')}`)
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken)
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    {
      body: [
        suggestionCommand.toJSON(),
        titlesCommand.toJSON(),
        calificarCommand.toJSON(),
        rankingCommand.toJSON(),
      ],
    },
  )
  console.log('[discord] Comandos /sugerir, /titulos, /calificar y /ranking registrados en el servidor.')
}

function getOption(interaction, name) {
  return interaction.data?.options?.find((option) => option.name === name)?.value
}

function sanitizeTitle(raw) {
  return String(raw || '')
    .replace(/[*_`~]/g, '')
    .replace(/^\s*[-*+•]\s+/, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function createSuggestionResponse(interaction) {
  const title = sanitizeTitle(getOption(interaction, 'titulo'))
  const category = getOption(interaction, 'categoria')

  if (!title || title.length < 2) {
    return { content: '⚠️ El título no es válido después de limpiarlo. Inténtalo de nuevo.' }
  }
  if (!Object.hasOwn(CATEGORY_META, category)) {
    return { content: '⚠️ La categoría seleccionada no es válida.' }
  }

  const user = interaction.member?.user || interaction.user
  const suggestedBy = user
    ? `${user.username}#${user.discriminator || '0'}`
    : 'desconocido'
  const rowId = `sug-${interaction.id}`
  const { error } = await insertSuggestion({
    id: rowId,
    title,
    category,
    suggestedBy,
  })

  if (error) {
    console.error('[discord] Error al insertar sugerencia:', error.message || error)
    return { content: '❌ No se pudo guardar la sugerencia. Inténtalo más tarde.' }
  }

  getSuggestionMeta(title, category)
    .then(async (meta) => {
      if (!meta) return
      const { error: updateError } = await updateMeta(rowId, meta)
      if (updateError) throw new Error(updateError.message || String(updateError))
    })
    .catch((err) => console.error('[discord] Error al enriquecer sugerencia:', err.message))

  const cat = CATEGORY_META[category]
  return {
    embeds: [{
      color: 0x2dd4bf,
      title: `${cat.emoji} Sugerencia añadida`,
      description: `**${title}** se ha añadido a la cola de la máquina.`,
      fields: [
        { name: 'Categoría', value: `${cat.emoji} ${cat.label}`, inline: true },
        { name: 'Sugerido por', value: suggestedBy, inline: true },
        { name: 'Estado', value: '🗂 En cola (PENDING)', inline: true },
      ],
      footer: { text: 'Wotakoi Machine' },
      timestamp: new Date().toISOString(),
    }],
    allowed_mentions: { parse: [] },
  }
}

function getTitleListRequest(interaction) {
  if (interaction.type === 3) {
    const match = /^titles:(all|anime|movie|series):(\d+)$/.exec(interaction.data?.custom_id || '')
    if (!match) return null
    const page = Number(match[2])
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return null
    return { category: match[1] === 'all' ? null : match[1], page }
  }

  const category = getOption(interaction, 'categoria') || 'all'
  if (!['all', 'anime', 'movie', 'series'].includes(category)) return null
  return { category: category === 'all' ? null : category, page: 1 }
}

async function createTitleListMessage(interaction) {
  const request = getTitleListRequest(interaction)
  if (!request) return { content: '⚠️ No se pudo interpretar la página de títulos.', components: [] }

  let result = await getAllTitlesPage(request.category, request.page, TITLE_LIST_PAGE_SIZE)
  if (result.error) {
    console.error('[discord] Error al consultar títulos:', result.error.message || result.error)
    return { content: '❌ No se pudieron consultar los títulos. Inténtalo más tarde.', components: [] }
  }

  const lastPage = Math.max(1, Math.ceil(result.count / TITLE_LIST_PAGE_SIZE))
  if (request.page > lastPage) {
    result = await getAllTitlesPage(request.category, lastPage, TITLE_LIST_PAGE_SIZE)
    if (result.error) {
      console.error('[discord] Error al consultar títulos:', result.error.message || result.error)
      return { content: '❌ No se pudieron consultar los títulos. Inténtalo más tarde.', components: [] }
    }
    request.page = lastPage
  }

  return createTitleListResponse({
    titles: result.data || [],
    count: result.count,
    page: request.page,
    category: request.category,
  })
}

async function findWatchedMedia(rawTitle) {
  const value = String(rawTitle || '').trim()
  if (!value) return { error: 'No se recibió el título a calificar.' }

  const { data: byId, error: byIdError } = await getById(value)
  if (!byIdError && byId) return { media: byId }

  const { data: matches, error: searchError } = await searchWatchedTitles(value, 25)
  if (searchError) return { error: searchError.message || String(searchError) }
  const list = matches || []
  const normalized = value.toLowerCase()
  const exact = list.filter((item) => String(item.title || '').trim().toLowerCase() === normalized)
  if (exact.length === 1) return { media: exact[0] }
  if (list.length === 1) return { media: list[0] }
  if (!list.length) return { error: `No encontramos una obra vista que coincida con «${value}».` }
  return { ambiguous: list.slice(0, 5) }
}

async function createRatingResponse(interaction) {
  const rawTitle = getOption(interaction, 'titulo')
  const rawComment = getOption(interaction, 'comentario')
  const user = interaction.member?.user || interaction.user
  if (!user) return { content: '⚠️ No se pudo identificar a quien califica.' }

  const validation = validateRating({
    score: getOption(interaction, 'nota'),
    comment: rawComment,
    raterName: user.username,
    source: 'discord',
  })
  if (validation.error) return { content: `⚠️ ${validation.error}` }

  const found = await findWatchedMedia(rawTitle)
  if (found.error) return { content: `⚠️ ${found.error}` }
  if (found.ambiguous) {
    const options = found.ambiguous.map((item) => `• ${item.title}`).join('\n')
    return { content: `⚠️ Hay varias obras que coinciden. Selecciona una desde el autocompletado:\n${options}` }
  }

  const media = found.media
  if (media.status !== 'WATCHED') {
    return { content: `⚠️ **${media.title}** todavía no está marcada como vista, así que aún no se puede calificar.` }
  }

  const { data: existingRatings, error: ratingsError } = await getRatingsForMedia(media.id)
  if (ratingsError) {
    console.error('[discord] Error al consultar calificaciones:', ratingsError.message || ratingsError)
    return { content: '❌ No se pudieron consultar las calificaciones. Inténtalo más tarde.' }
  }
  const previous = (existingRatings || []).find((rating) => rating.raterKey === validation.value.raterKey)

  const { data: saved, error: saveError } = await upsertRating({
    mediaId: media.id,
    raterKey: validation.value.raterKey,
    raterName: validation.value.raterName,
    discordUserId: user.id,
    source: 'discord',
    score: validation.value.score,
    comment: rawComment === undefined ? undefined : validation.value.comment,
  })
  if (saveError) {
    console.error('[discord] Error al guardar calificación:', saveError.message || saveError)
    return { content: '❌ No se pudo guardar la calificación. Inténtalo más tarde.' }
  }
  if (!saved) {
    console.error('[discord] La calificación se guardó sin devolver datos.')
    return { content: '❌ No se pudo confirmar la calificación. Inténtalo más tarde.' }
  }

  const { data: stats } = await getWatchStatsById(media.id)
  return buildRatingResponse({
    media,
    rating: { score: saved.score, comment: saved.comment },
    averageScore: stats?.averageScore ?? saved.score,
    ratingCount: stats?.ratingCount ?? 1,
    updated: Boolean(previous),
  })
}

async function createRankingMessage(interaction) {
  const requested = getOption(interaction, 'categoria') || 'all'
  if (!['all', 'anime', 'movie', 'series'].includes(requested)) {
    return { content: '⚠️ La categoría seleccionada no es válida.' }
  }
  const category = requested === 'all' ? null : requested
  const { data, error } = await getRankings(category, RANKING_LIMIT)
  if (error) {
    console.error('[discord] Error al consultar el ranking:', error.message || error)
    return { content: '❌ No se pudo consultar el ranking. Inténtalo más tarde.' }
  }
  return buildRankingResponse({ titles: data || [], category })
}

export async function completeDiscordInteraction(interaction) {
  const commandName = interaction.data?.name
  let response
  if (interaction.type === 3 || commandName === 'titulos') {
    response = await createTitleListMessage(interaction)
  } else if (commandName === 'calificar') {
    response = await createRatingResponse(interaction)
  } else if (commandName === 'ranking') {
    response = await createRankingMessage(interaction)
  } else {
    response = await createSuggestionResponse(interaction)
  }

  const url = `https://discord.com/api/v10/webhooks/${config.discordClientId}/${interaction.token}/messages/@original`
  const result = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
    signal: AbortSignal.timeout(10000),
  })
  if (!result.ok) {
    throw new Error(`Discord no aceptó la respuesta: ${result.status} ${result.statusText}`)
  }
}
