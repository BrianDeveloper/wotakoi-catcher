import { useCallback, useRef, useState } from 'react'
import { CAPSULE_LIMIT } from '../constants/game'
import { fetchAnimes, fetchHistory } from '../lib/api'
import { generateCapsulePositions } from '../lib/gamePhysics'
import type { AnimeEntry, CapsulePosition, MachineKey } from '../types'

export interface UseMachineDataOptions {
  /** Devuelve true si hay una sesión de juego activa (para no romperla en refrescos) */
  isSessionActive?: () => boolean
}

export function useMachineData({ isSessionActive }: UseMachineDataOptions = {}) {
  const [remaining, setRemaining] = useState<AnimeEntry[]>([])
  const [positions, setPositions] = useState<CapsulePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [history, setHistory] = useState<AnimeEntry[]>([])

  const activeRef = useRef(isSessionActive)
  activeRef.current = isSessionActive

  const reload = useCallback(async (category: MachineKey, force = false) => {
    try {
      const data = await fetchAnimes(category)
      if (data.capsules) {
        // No romper la sesión activa salvo que sea un cambio forzado (montaje / cambio de máquina)
        if (activeRef.current?.() && !force) {
          setLoading(false)
          return
        }
        const pool = data.capsules.slice(0, CAPSULE_LIMIT)
        setRemaining(pool)
        setPositions(generateCapsulePositions(pool.length))
        setLoadError(null)
      }
      setLoading(false)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error de conexión')
      setLoading(false)
    }
  }, [])

  const appendCapsule = useCallback((entry: AnimeEntry) => {
    setRemaining((prev) => [...prev, entry])
    setPositions((prev) => generateCapsulePositions(prev.length + 1))
  }, [])

  const removeCapsule = useCallback((index: number) => {
    setRemaining((prev) => prev.filter((_, i) => i !== index))
    setPositions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const refreshHistory = useCallback(async () => {
    try {
      const items = await fetchHistory()
      setHistory(items)
    } catch {
      setHistory([])
    }
  }, [])

  return {
    remaining,
    positions,
    loading,
    loadError,
    history,
    setPositions,
    reload,
    appendCapsule,
    removeCapsule,
    refreshHistory,
  }
}