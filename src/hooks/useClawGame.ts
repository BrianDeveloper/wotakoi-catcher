import { useCallback, useEffect, useRef, useState } from 'react'
import { MACHINES } from '../constants/machineThemes'
import { REFRESH_INTERVAL_MIN } from '../constants/game'
import { resetMachine } from '../lib/api'
import { useMachineData } from './useMachineData'
import { useClawAnimation } from './useClawAnimation'
import { useClawPayout } from './useClawPayout'
import { useDiscordSync } from './useDiscordSync'
import { useTitlesLibrary } from './useTitlesLibrary'
import type { MachineKey } from '../types'

export function useClawGame() {
  const [categoryFilter, setCategoryFilter] = useState<MachineKey>('anime')
  const [resetting, setResetting] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [historyOpen, setHistoryOpen] = useState(false)

  const sessionStarted = useRef(false)
  const isIdleRef = useRef(true)

  const {
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
  } = useMachineData({ isSessionActive: () => sessionStarted.current })

  // Cargar la máquina activa al montar y cada cierto tiempo
  useEffect(() => {
    reload(categoryFilter, true)
    const id = window.setInterval(() => reload(categoryFilter, false), REFRESH_INTERVAL_MIN * 60 * 1000)
    return () => window.clearInterval(id)
  }, [reload, categoryFilter])

  const anim = useClawAnimation(isIdleRef)
  const payout = useClawPayout({
    anim,
    machineData: { remaining, positions, setPositions, removeCapsule, appendCapsule },
    sessionStartedRef: sessionStarted,
    isIdleRef,
  })
  const discordSync = useDiscordSync()
  const library = useTitlesLibrary()

  // Sincronizar con el canal de sugerencias y refrescar la máquina activa con lo nuevo
  const syncDiscord = useCallback(async () => {
    const ok = await discordSync.syncNow()
    if (ok) await reload(categoryFilter, true)
  }, [discordSync.syncNow, reload, categoryFilter])

  // Cambiar de máquina: deslizar el gabinete hacia el lado del botón pulsado
  const changeMachine = useCallback((dir: 'left' | 'right') => {
    const idx = MACHINES.findIndex((m) => m.key === categoryFilter)
    const nextIdx = dir === 'right'
      ? (idx + 1) % MACHINES.length
      : (idx - 1 + MACHINES.length) % MACHINES.length
    const key = MACHINES[nextIdx].key
    setSlideDir(dir)
    setCategoryFilter(key)
    payout.resetSession()
    reload(key, true)
  }, [categoryFilter, payout.resetSession, reload])

  const openHistory = useCallback(async () => {
    setHistoryOpen(true)
    await refreshHistory()
  }, [refreshHistory])

  const closeHistory = useCallback(() => setHistoryOpen(false), [])

  const handleAdminReset = useCallback(async () => {
    if (!window.confirm('¿Resetear todas las cápsulas a PENDING? La máquina se rellenará con 30 premios.')) return
    setResetting(true)
    try {
      await resetMachine()
      payout.resetSession()
      await reload(categoryFilter, true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resetear')
    } finally {
      setResetting(false)
    }
  }, [payout.resetSession, reload, categoryFilter])

  const activeMachine = MACHINES.find((m) => m.key === categoryFilter) || MACHINES[0]

  return {
    remaining,
    positions,
    categoryFilter,
    loading,
    loadError,
    history,
    historyOpen,
    dispensed: payout.dispensed,
    grabbedAnime: payout.grabbedAnime,
    machineState: payout.machineState,
    modalAnime: payout.modalAnime,
    isShaking: payout.isShaking,
    resetting,
    slideDir,
    activeMachine,
    clawXControls: anim.clawXControls,
    clawYControls: anim.clawYControls,
    clawProngsControls: anim.clawProngsControls,
    grabbedCapsuleControls: anim.grabbedCapsuleControls,
    chuteX: anim.chuteX,
    changeMachine,
    startMoving: anim.startMoving,
    stopMoving: anim.stopMoving,
    handleShake: payout.handleShake,
    handlePlay: payout.handlePlay,
    handleOpenCapsule: payout.handleOpenCapsule,
    handleCloseModal: payout.handleCloseModal,
    handleAdminReset,
    openHistory,
    closeHistory,
    syncDiscord,
    syncing: discordSync.syncing,
    lastSyncAdded: discordSync.lastAdded,
    lastSyncError: discordSync.lastError,
    titles: library.titles,
    libraryOpen: library.open,
    libraryFilter: library.filter,
    libraryLoading: library.loading,
    libraryError: library.error,
    openLibrary: library.openLibrary,
    closeLibrary: library.closeLibrary,
    selectLibraryCategory: library.selectCategory,
  }
}