export const RATING_MIN = 1
export const RATING_MAX = 10
export const COMMENT_MAX_LENGTH = 500
export const RATER_NAME_STORAGE_KEY = 'wotakoi-rater-name'
export const RATING_SCORES = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
)
export const MEDAL_EMOJIS = ['🥇', '🥈', '🥉']

export const RATING_LABELS: Record<number, string> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Floja',
  4: 'Regular',
  5: 'Pasable',
  6: 'Buena',
  7: 'Notable',
  8: 'Muy buena',
  9: 'Excelente',
  10: 'Obra maestra',
}

export function ratingLabel(score: number): string {
  return RATING_LABELS[score] || ''
}
