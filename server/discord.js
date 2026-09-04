import config from './config.js'
import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js'
import { insertSuggestion, updateMeta } from './supabase.js'
import { getSuggestionMeta } from './jikan.js'

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

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Limpia el título para búsquedas en APIs: quita emojis/unicodes/símbolos extraños
function sanitizeTitle(raw) {
  return normalizeTitle(String(raw || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')) // emojis
    .replace(/\s+/g, ' ')
    .trim()
}

function extractEntries(messages) {
  const seen = new Set()
  const entries = []

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

      entries.push({
        id: `${msg.id}-${slugify(title)}`,
        title,
        createdAt: msg.timestamp || null,
      })
    }
  }

  return entries
}

export async function getTitles() {
  const messages = await fetchMessages()
  return extractEntries(messages)
}

// ─── Bot gateway + comando /sugerir ───────────────────────────────────────────

const CATEGORY_META = {
  anime: { emoji: '🍥', label: 'Anime' },
  movie: { emoji: '🎬', label: 'Película' },
  series: { emoji: '📺', label: 'Serie' },
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
})

const commandData = new SlashCommandBuilder()
  .setName('sugerir')
  .setDescription('Envía y categoriza una sugerencia de contenido para la máquina')
  .addStringOption((o) =>
    o.setName('titulo').setDescription('Nombre exacto de la obra').setRequired(true))
  .addStringOption((o) =>
    o.setName('categoria')
      .setDescription('Categoría de la obra')
      .setRequired(true)
      .addChoices(
        { name: 'Anime', value: 'anime' },
        { name: 'Película', value: 'movie' },
        { name: 'Serie', value: 'series' }))

async function registerCommands() {
  if (!config.discordClientId || !config.discordGuildId) {
    console.warn('[discord] Faltan DISCORD_CLIENT_ID o DISCORD_GUILD_ID; comando no registrado.')
    return
  }
  const rest = new REST({ version: '10' }).setToken(config.discordToken)
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: [commandData.toJSON()] },
  )
  console.log('[discord] Comando /sugerir registrado en el guild.')
}

async function handleSugerir(interaction) {
  const titulo = interaction.options.getString('titulo')
  const categoria = interaction.options.getString('categoria')
  const title = sanitizeTitle(titulo)

  if (!title || title.length < 2) {
    await interaction.editReply('⚠️ El título no es válido después de limpiarlo. Inténtalo de nuevo.')
    return
  }

  const suggestedBy = interaction.user
    ? `${interaction.user.username}#${interaction.user.discriminator || '0'}`
    : String(interaction.userId || 'desconocido')

  const rowId = `sug-${interaction.id}`

  const { error: insErr } = await insertSuggestion({
    id: rowId,
    title,
    category: categoria,
    suggestedBy,
  })
  if (insErr) {
    console.error('[discord] Error al insertar sugerencia:', insErr.message)
    await interaction.editReply('❌ No se pudo guardar la sugerencia. Inténtalo más tarde.')
    return
  }

  // Enriquecer con TMDB de inmediato (sin bloquear la respuesta)
  getSuggestionMeta(title, categoria)
    .then(async (meta) => {
      if (meta) await updateMeta(rowId, meta)
    })
    .catch((err) => console.error('[discord] Error al enriquecer sugerencia:', err.message))

  const cat = CATEGORY_META[categoria] || CATEGORY_META.series
  const embed = new EmbedBuilder()
    .setColor(0x2dd4bf)
    .setTitle(`${cat.emoji} Sugerencia añadida`)
    .setDescription(`**${title}** se ha añadido a la cola de la máquina.`)
    .addFields(
      { name: 'Categoría', value: `${cat.emoji} ${cat.label}`, inline: true },
      { name: 'Sugerido por', value: suggestedBy, inline: true },
      { name: 'Estado', value: '🗂 En cola (PENDING)', inline: true },
    )
    .setFooter({ text: 'Wotakoi Machine' })
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}

export function startBot() {
  client.once(Events.ClientReady, async (c) => {
    console.log(`[discord] Bot conectado como ${c.user.tag}`)
    try {
      await registerCommands()
    } catch (err) {
      console.error('[discord] No se pudo registrar el comando:', err.message)
    }
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    if (interaction.commandName !== 'sugerir') return

    try {
      await interaction.deferReply()
      await handleSugerir(interaction)
    } catch (err) {
      console.error('[discord] Error en /sugerir:', err.message)
      await interaction.editReply('❌ Ocurrió un error procesando la sugerencia.').catch(() => {})
    }
  })

  client.on(Events.Error, (err) => console.error('[discord] Error de conexión:', err.message))

  if (config.discordToken) {
    client.login(config.discordToken).catch((err) => {
      console.error('[discord] No se pudo iniciar sesión:', err.message)
    })
  } else {
    console.warn('[discord] Falta DISCORD_TOKEN; bot no iniciado.')
  }
}
