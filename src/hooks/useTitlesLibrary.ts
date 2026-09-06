import { useCallback, useState } from 'react'
import { fetchTitles } from '../lib/api'
import type { AnimeEntry } from '../types'
import type { TitleFilter } from '../constants/titles'

/** Datos de la biblioteca completa de títulos, filtrable por categoría */
export function useTitlesLibrary() {
  const [titles, setTitles] = useState<AnimeEntry[]>([])
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<TitleFilter>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (category: TitleFilter) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTitles(category === 'all' ? null : category)
      setTitles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar títulos')
      setTitles([])
    } finally {
      setLoading(false)
    }
  }, [])

  const openLibrary = useCallback(async () => {
    setOpen(true)
    await reload(filter)
  }, [filter, reload])

  const closeLibrary = useCallback(() => setOpen(false), [])

  const selectCategory = useCallback(async (category: TitleFilter) => {
    setFilter(category)
    await reload(category)
  }, [reload])

  return {
    titles,
    open,
    filter,
    loading,
    error,
    openLibrary,
    closeLibrary,
    selectCategory,
  }
}