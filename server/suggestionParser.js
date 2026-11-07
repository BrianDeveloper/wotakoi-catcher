function normalizeTitle(raw) {
  return String(raw || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*(?:[-*+•]\s+|\d+[.)]\s+)/, '')
    .replace(/[*_`~]/g, '')
    .replace(/^(?:t[ií]tulo|title|sugerencia|suggestion)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeTitle(raw) {
  return normalizeTitle(raw)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeForDeduplication(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
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

export function extractSuggestionEntries(messages) {
  const seen = new Set()
  const entries = []
  const ignored = []

  for (const message of messages) {
    for (const rawLine of String(message.content || '').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue
      if (line.startsWith('#') || line.startsWith('!')) {
        ignored.push({ text: line, reason: 'Se ignoró como encabezado o comentario, no como sugerencia.' })
        continue
      }
      if (/^(?:categor[ií]a|category)\s*:/i.test(line)) {
        ignored.push({ text: line, reason: 'Es una etiqueta de categoría, no un título.' })
        continue
      }

      const title = sanitizeTitle(line)
      if (title.length < 2) {
        ignored.push({ text: line, reason: 'El texto queda vacío o es demasiado corto al limpiarlo.' })
        continue
      }
      if (title.endsWith(':')) {
        ignored.push({ text: line, reason: 'Parece un encabezado, no un título.' })
        continue
      }
      const key = normalizeForDeduplication(title)
      if (!key) {
        ignored.push({ text: line, reason: 'No contiene caracteres utilizables para buscar el título.' })
        continue
      }
      if (seen.has(key)) {
        ignored.push({ text: title, reason: 'Título duplicado en los mensajes de esta sincronización.' })
        continue
      }
      seen.add(key)

      entries.push({
        id: `${message.id}-${slugify(title)}`,
        title,
        createdAt: message.timestamp || null,
      })
    }
  }

  return { entries, ignored }
}
