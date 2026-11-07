import { useCallback, useState } from 'react'
import { syncSuggestions } from '../lib/api'

/** Consulta el backend para importar títulos nuevos del canal de sugerencias de Discord */
export function useDiscordSync() {
  const [syncing, setSyncing] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)
  const [lastMessagesRead, setLastMessagesRead] = useState(0)
  const [backfillComplete, setBackfillComplete] = useState(false)
  const [restartedForEmptyMedia, setRestartedForEmptyMedia] = useState(false)
  const [lastIgnored, setLastIgnored] = useState<Array<{ text: string; reason: string }>>([])
  const [lastDiscarded, setLastDiscarded] = useState<Array<{
    title: string
    reason: string
    bestMatch: string | null
    score: number
    threshold: number
  }>>([])
  const [lastFailures, setLastFailures] = useState<Array<{ title: string; reason: string }>>([])
  const [lastError, setLastError] = useState<string | null>(null)

  const syncNow = useCallback(async (adminKey: string) => {
    setSyncing(true)
    setLastError(null)
    try {
      const {
        added,
        messagesRead,
        backfillComplete: isBackfillComplete,
        restartedForEmptyMedia: didRestart,
        ignored,
        discarded,
        failed,
      } = await syncSuggestions(adminKey)
      setLastAdded(added)
      setLastMessagesRead(messagesRead)
      setBackfillComplete(isBackfillComplete)
      setRestartedForEmptyMedia(didRestart)
      setLastIgnored(ignored)
      setLastDiscarded(discarded)
      setLastFailures(failed)
      return true
    } catch (err) {
      setLastAdded(null)
      setLastMessagesRead(0)
      setBackfillComplete(false)
      setRestartedForEmptyMedia(false)
      setLastIgnored([])
      setLastDiscarded([])
      setLastFailures([])
      setLastError(err instanceof Error ? err.message : 'Error al sincronizar')
      return false
    } finally {
      setSyncing(false)
    }
  }, [])

  return {
    syncing,
    lastAdded,
    lastMessagesRead,
    backfillComplete,
    restartedForEmptyMedia,
    lastIgnored,
    lastDiscarded,
    lastFailures,
    lastError,
    syncNow,
  }
}