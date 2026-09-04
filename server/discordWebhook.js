import config from './config.js'
import { EmbedBuilder } from 'discord.js'

const CATEGORY_COLOR = {
  anime: 0xff007f,
  movie: 0xffd700,
  series: 0x00ff66,
}

const CATEGORY_LABEL = {
  anime: 'Anime',
  movie: 'Película',
  series: 'Serie',
}

// Recorta una sinopsis de forma limpia (en límite de palabra) a máximo `max` caracteres
function clipDescription(text, max = 200) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean || 'Sinopsis no disponible.'
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const clipped = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
  return clipped.trim() + '…'
}

export async function sendDiscordWebhookNotification(mediaItem) {
  if (!config.discordWebhookUrl || !mediaItem || !mediaItem.title) return

  const title = mediaItem.title
  const category = mediaItem.category || 'series'
  const image = mediaItem.image || null
  const suggestedBy = mediaItem.suggested_by || null

  const embed = new EmbedBuilder()
    .setColor(CATEGORY_COLOR[category] ?? 0x5865f2)
    .setTitle(title)
    .setDescription(clipDescription(mediaItem.synopsis))
    .addFields(
      { name: 'Categoría', value: CATEGORY_LABEL[category] || 'Otro', inline: true },
      { name: 'Sugerido por', value: suggestedBy || '—', inline: true },
    )
    .setFooter({ text: 'Máquina de Gancho Discord • Sesión de Selección' })
    .setTimestamp()
  if (image) embed.setImage(image)

  const payload = {
    content: `🎮 ¡La Máquina de Gancho ha hablado! La obra seleccionada para la sesión de hoy es: **${title}**.`,
    embeds: [embed.toJSON()],
  }

  try {
    const res = await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error(`[webhook] Discord respondió ${res.status} ${res.statusText}`)
    }
  } catch (err) {
    console.error('[webhook] no se pudo enviar la notificación:', err.message)
  }
}
