import config from './config.js'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { getAllTitlesPage, insertSuggestion, updateMeta } from './supabase.js'
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
    { body: [suggestionCommand.toJSON(), titlesCommand.toJSON()] },
  )
  console.log('[discord] Comandos /sugerir y /titulos registrados en el servidor.')
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

export async function completeDiscordInteraction(interaction) {
  const response = interaction.type === 3
    || interaction.data?.name === 'titulos'
    ? await createTitleListMessage(interaction)
    : await createSuggestionResponse(interaction)
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
