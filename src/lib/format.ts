const DEFAULT_COVER = '/default-cover.svg'
const PLACEHOLDER_RE = /placeholder\.com|via\.placeholder|text=Sin\+?Imagen/i

/** Devuelve la portada de la obra o un placeholder cuando la API no la encontró */
export function coverImage(image?: string | null): string {
  if (image && !PLACEHOLDER_RE.test(image)) return image
  return DEFAULT_COVER
}

export function categoryEmoji(category?: string) {
  switch (category) {
    case 'anime': return '🍥'
    case 'movie': return '🎬'
    case 'series': return '📺'
    default: return '👾'
  }
}