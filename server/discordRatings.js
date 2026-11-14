import { SlashCommandBuilder } from 'discord.js'
import {
  MEDALS,
  RANKING_LIMIT,
  formatAverage,
  formatVotes,
  truncateText,
} from './ratings.js'

const CATEGORY_META = {
  anime: { emoji: '🍥', label: 'Anime' },
  movie: { emoji: '🎬', label: 'Película' },
  series: { emoji: '📺', label: 'Serie' },
}

const AUTOCOMPLETE_LIMIT = 25

function escapeMarkdown(value) {
  return String(value || '').replace(/[\\_*~|`>]/g, '\\$&')
}

function escapeUnescapedMarkdown(value) {
  return String(value || '').replace(/(?<!\\)([\\_*~|`>])/g, '\\$1')
}

function categoryLabel(category) {
  return CATEGORY_META[category]?.label || 'Sin categoría'
}

function categoryEmoji(category) {
  return CATEGORY_META[category]?.emoji || '🏷'
}

export const calificarCommand = new SlashCommandBuilder()
  .setName('calificar')
  .setDescription('Califica de 1 a 10 una obra que ya se vio')
  .addStringOption((option) =>
    option
      .setName('titulo')
      .setDescription('Obra vista que quieres calificar')
      .setRequired(true)
      .setAutocomplete(true))
  .addIntegerOption((option) =>
    option
      .setName('nota')
      .setDescription('Nota entera de 1 a 10')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10))
  .addStringOption((option) =>
    option
      .setName('comentario')
      .setDescription('Comentario opcional (máximo 500 caracteres)')
      .setRequired(false)
      .setMaxLength(500))

export const rankingCommand = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('Muestra el podio de las obras mejor calificadas')
  .addStringOption((option) =>
    option
      .setName('categoria')
      .setDescription('Filtra el ranking por categoría')
      .setRequired(false)
      .addChoices(
        { name: 'Todas', value: 'all' },
        { name: 'Anime', value: 'anime' },
        { name: 'Película', value: 'movie' },
        { name: 'Serie', value: 'series' }))

export function getCommandOption(interaction, name) {
  return interaction.data?.options?.find((option) => option.name === name)?.value
}

export function getFocusedOption(interaction) {
  return interaction.data?.options?.find((option) => option.focused)?.value
}

export function buildAutocompleteResponse(titles = []) {
  const choices = titles.slice(0, AUTOCOMPLETE_LIMIT).map((title) => {
    const suffix = ` · ${categoryLabel(title.category)}`
    return {
      name: `${truncateText(title.title, 100 - suffix.length)}${suffix}`,
      value: String(title.id).slice(0, 100),
    }
  })
  return { type: 8, data: { choices } }
}

export function buildRatingResponse({
  media,
  rating,
  averageScore,
  ratingCount,
  updated = false,
}) {
  const fields = [
    { name: 'Nota', value: `⭐ ${rating.score}/10`, inline: true },
    { name: 'Promedio', value: `📊 ${formatAverage(averageScore)}/10`, inline: true },
    { name: 'Votos', value: `🗳 ${formatVotes(ratingCount)}`, inline: true },
    {
      name: 'Categoría',
      value: `${categoryEmoji(media.category)} ${categoryLabel(media.category)}`,
      inline: true,
    },
  ]
  if (rating.comment) {
    fields.push({
      name: 'Comentario',
      value: escapeMarkdown(truncateText(rating.comment, 500)),
      inline: false,
    })
  }

  return {
    embeds: [{
      color: updated ? 0x2dd4bf : 0x22d3ee,
      title: updated ? '✏️ Calificación actualizada' : '⭐ Calificación guardada',
      description: `**${escapeMarkdown(media.title)}** recibió **${rating.score}/10**.`,
      fields,
      footer: { text: 'Wotakoi Machine · Calificaciones' },
      timestamp: new Date().toISOString(),
    }],
    allowed_mentions: { parse: [] },
  }
}

export function buildRankingResponse({ titles = [], category = null }) {
  const scope = category ? categoryLabel(category) : 'Todas las categorías'
  if (!titles.length) {
    return {
      embeds: [{
        color: 0x64748b,
        title: '🏆 Ranking Wotakoi',
        description: 'Aún no hay obras calificadas. Usa `/calificar` después de ver una obra.',
        footer: { text: `${scope} · 0 obras calificadas` },
      }],
      allowed_mentions: { parse: [] },
    }
  }

  const top = titles.slice(0, RANKING_LIMIT)
  const podium = top.slice(0, MEDALS.length)
  const rest = top.slice(MEDALS.length)
  const podiumLines = podium.map((item, index) =>
    `${MEDALS[index]} **${escapeUnescapedMarkdown(item.title)}** — ⭐ ${formatAverage(item.averageScore)} · ${formatVotes(item.ratingCount)}`)
  const restLines = rest.map((item, index) =>
    `${index + MEDALS.length + 1}. **${escapeUnescapedMarkdown(item.title)}** — ⭐ ${formatAverage(item.averageScore)} · ${formatVotes(item.ratingCount)}`)
  const description = [...podiumLines, ...restLines].join('\n')
  const topLabel = top.length === 1 ? 'obra en el ranking' : 'obras en el ranking'

  return {
    embeds: [{
      color: 0xfbbf24,
      title: `🏆 Ranking Wotakoi · ${scope}`,
      description,
      footer: { text: `${top.length} ${topLabel} · ${scope}` },
      timestamp: new Date().toISOString(),
    }],
    allowed_mentions: { parse: [] },
  }
}
