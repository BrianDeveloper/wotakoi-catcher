import { useCallback, useState } from 'react'
import { syncSuggestions } from '../lib/api'

/** Consulta el backend para importar títulos nuevos del canal de sugerencias de Discord */
export function useDiscordSync() {
  const [syncing, setSyncing] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const syncNow = useCallback(async () => {
    setSyncing(true)
    setLastError(null)
    try {
      const { added } = await syncSuggestions()
      setLastAdded(added)
      return true
    } catch (err) {
      setLastAdded(null)
      setLastError(err instanceof Error ? err.message : 'Error al sincronizar')
      return false
    } finally {
      setSyncing(false)
    }
  }, [])

  return { syncing, lastAdded, lastError, syncNow }
}