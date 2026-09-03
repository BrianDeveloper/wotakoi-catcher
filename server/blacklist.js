const normalize = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const BLACKLIST = [
  'Better call Saul',
  'Hereditary',
  'The drama',
  'The house',
  'Welcome to Derry',
  'Ginny & Georgia',
  'Monster Inc',
  'Harry Potter',
  'Piratas del Caribe',
  'El fantasma de la ópera',
  'Scooby Doo - Misterios S.A.',
  'Las sombrías aventuras de Billy y Mandy',
  'Coraje: El perro cobarde',
  'Eterno resplandor de una mente sin recuerdos',
  'Punch Drunk Love',
  'Her',
  'Blade Runner',
  'Breaking Bad',
  'Game of Thrones',
  'Stranger Things',
  'The Big Bang Theory',
  'Friends (serie)',
]

const BLACKLIST_KEYS = new Set(BLACKLIST.map(normalize))

export function isBlacklisted(title) {
  return BLACKLIST_KEYS.has(normalize(title))
}
