import config from './config.js'

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

const TEMPLATE_VARIABLES = new Set(['title', 'category', 'suggested_by', 'synopsis'])

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  content: '🎮 ¡La Máquina de Gancho ha hablado! La obra seleccionada para la sesión de hoy es: **{title}**.',
  embedTitle: '{title}',
  embedDescription: '{synopsis}',
  embedFooter: 'Máquina de Gancho Discord • Sesión de Selección',
  showImage: true,
}

function renderTemplate(template, values, maxLength) {
  const rendered = template.replace(/\{([^{}]+)\}/g, (placeholder, key) => {
    if (!TEMPLATE_VARIABLES.has(key)) {
      throw new Error(`Variable de plantilla no permitida: {${key}}`)
    }
    return values[key] || ''
  })
  return rendered.slice(0, maxLength)
}

export function validateNotificationSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'La configuración de notificaciones debe ser un objeto' }
  }

  const limits = {
    content: 2000,
    embedTitle: 256,
    embedDescription: 4096,
    embedFooter: 2048,
  }
  const settings = {}

  for (const [field, maxLength] of Object.entries(limits)) {
    const value = input[field]
    if (typeof value !== 'string') {
      return { error: `El campo ${field} debe ser texto` }
    }
    if (value.length > maxLength) {
      return { error: `El campo ${field} supera el límite de ${maxLength} caracteres` }
    }
    const variables = [...value.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1])
    const invalidVariable = variables.find((key) => !TEMPLATE_VARIABLES.has(key))
    if (invalidVariable) return { error: `Variable de plantilla no permitida: {${invalidVariable}}` }
    settings[field] = value
  }

  if (typeof input.showImage !== 'boolean') {
    return { error: 'El campo showImage debe ser booleano' }
  }
  settings.showImage = input.showImage

  if (!settings.content && !settings.embedTitle && !settings.embedDescription) {
    return { error: 'La notificación debe incluir texto o contenido en el embed' }
  }
  return { settings }
}

export function buildWebhookPayload(mediaItem, settings = DEFAULT_NOTIFICATION_SETTINGS) {
  const category = mediaItem.category || 'series'
  const values = {
    title: String(mediaItem.title || ''),
    category: CATEGORY_LABEL[category] || 'Otro',
    suggested_by: String(mediaItem.suggested_by || '—'),
    synopsis: String(mediaItem.synopsis || 'Sinopsis no disponible.').replace(/\s+/g, ' ').trim(),
  }

  const embed = {
    color: CATEGORY_COLOR[category] ?? 0x5865f2,
    timestamp: new Date().toISOString(),
  }
  const title = renderTemplate(settings.embedTitle, values, 256)
  const description = renderTemplate(settings.embedDescription, values, 4096)
  const footer = renderTemplate(settings.embedFooter, values, 2048)
  if (title) embed.title = title
  if (description) embed.description = description
  if (footer) embed.footer = { text: footer }
  if (settings.showImage && mediaItem.image) embed.image = { url: mediaItem.image }

  const content = renderTemplate(settings.content, values, 2000)
  const payload = { allowed_mentions: { parse: [] } }
  if (content) payload.content = content
  if (title || description || footer || (settings.showImage && mediaItem.image)) {
    payload.embeds = [embed]
  }
  return payload
}

export async function sendDiscordWebhookNotification(mediaItem, settings = DEFAULT_NOTIFICATION_SETTINGS) {
  if (!config.discordWebhookUrl) {
    throw new Error('Falta DISCORD_WEBHOOK_URL en server/.env')
  }
  if (!mediaItem || !mediaItem.title) {
    throw new Error('No se puede notificar una obra sin título')
  }

  const payload = buildWebhookPayload(mediaItem, settings)
  const response = await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) {
    throw new Error(`Discord respondió ${response.status} ${response.statusText}`)
  }
}
