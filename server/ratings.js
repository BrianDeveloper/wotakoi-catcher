export const RATING_MIN = 1
export const RATING_MAX = 10
export const COMMENT_MAX_LENGTH = 500
export const RATER_NAME_MAX_LENGTH = 80
export const RANKING_LIMIT = 10
export const RANKING_MIN_VOTES = 1
export const RATING_SOURCES = ['discord', 'web']
export const MEDALS = ['🥇', '🥈', '🥉']

export function normalizeRaterKey(raw) {
  return String(raw || '')
    .normalize('NFKC')
    .trim()
    .replace(/^@+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function normalizeRaterName(raw) {
  return String(raw || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeComment(raw) {
  const comment = String(raw ?? '').replace(/\r\n/g, '\n').trim()
  return comment || null
}

export function validateRating({ score, comment, raterName, source }) {
  const numericScore = typeof score === 'string' && score.trim() !== ''
    ? Number(score)
    : score
  if (!Number.isInteger(numericScore) || numericScore < RATING_MIN || numericScore > RATING_MAX) {
    return { error: `La nota debe ser un entero entre ${RATING_MIN} y ${RATING_MAX}.` }
  }

  const name = normalizeRaterName(raterName)
  if (!name) return { error: 'Necesitamos el nombre o usuario de quien califica.' }
  if (name.length > RATER_NAME_MAX_LENGTH) {
    return { error: `El nombre no puede superar ${RATER_NAME_MAX_LENGTH} caracteres.` }
  }

  const normalizedComment = normalizeComment(comment)
  if (normalizedComment && normalizedComment.length > COMMENT_MAX_LENGTH) {
    return { error: `El comentario no puede superar ${COMMENT_MAX_LENGTH} caracteres.` }
  }

  const normalizedSource = String(source || '').toLowerCase()
  if (!RATING_SOURCES.includes(normalizedSource)) {
    return { error: 'El origen de la calificación no es válido.' }
  }

  return {
    value: {
      score: numericScore,
      comment: normalizedComment,
      raterName: name,
      raterKey: normalizeRaterKey(name),
      source: normalizedSource,
    },
  }
}

export function formatAverage(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return numeric.toFixed(1)
}

export function formatVotes(count) {
  const numeric = Number(count) || 0
  return `${numeric} ${numeric === 1 ? 'voto' : 'votos'}`
}

export function escapeLikePattern(raw) {
  return String(raw || '').replace(/[\\%_]/g, '\\$&')
}

export function truncateText(raw, maxLength) {
  const text = String(raw || '')
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}
