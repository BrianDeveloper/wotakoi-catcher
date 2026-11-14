import { RATER_NAME_STORAGE_KEY } from '../constants/ratings'

export function getStoredRaterName(): string {
  try {
    return localStorage.getItem(RATER_NAME_STORAGE_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function storeRaterName(name: string): void {
  const clean = name.trim()
  try {
    if (clean) localStorage.setItem(RATER_NAME_STORAGE_KEY, clean)
    else localStorage.removeItem(RATER_NAME_STORAGE_KEY)
  } catch {
    // El almacenamiento puede estar deshabilitado; la calificación sigue funcionando.
  }
}
