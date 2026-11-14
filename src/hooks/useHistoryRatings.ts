import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRankings } from '../lib/api'
import type { RankedTitle } from '../types'

export function useHistoryRatings(open: boolean) {
  const [rankings, setRankings] = useState<RankedTitle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRankings(await fetchRankings(null, 10))
    } catch (err) {
      setRankings([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar el ranking')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const rankingById = useMemo(
    () => new Map(rankings.map((item) => [item.id, item])),
    [rankings],
  )

  return { rankings, rankingById, loading, error, refresh }
}
