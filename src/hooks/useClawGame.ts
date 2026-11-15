import { useCallback, useEffect, useRef, useState } from 'react'
import { MACHINES } from '../constants/machineThemes'
import { REFRESH_INTERVAL_MIN } from '../constants/game'
import { correctTitle as correctTitleRequest, deleteTitle as deleteTitleRequest, resetMachine, reshuffleMachine, setTitleStatus as setTitleStatusRequest, clearMachine as clearMachineRequest } from '../lib/api'
import type { ClearMachineResult, ReshuffleResult, TitleCorrectionResult } from '../lib/api'
import { useMachineData } from './useMachineData'
import { useClawAnimation } from './useClawAnimation'
import { useClawPayout } from './useClawPayout'
import { useDiscordSync } from './useDiscordSync'
import { useTitlesLibrary } from './useTitlesLibrary'
import type { MachineKey, MachineTarget, TitleStatus } from '../types'

export function useClawGame() {
  const [categoryFilter, setCategoryFilter] = useState<MachineKey>('anime')
  const [resetting, setResetting] = useState(false)
  const [reshuffling, setReshuffling] = useState(false)
  const [clearing, setClearing] = useState<MachineTarget | null>(null)
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

  const availableMachines = MACHINES

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
  const syncDiscord = useCallback(async (adminKey: string) => {
    const ok = await discordSync.syncNow(adminKey)
    if (ok) await reload(categoryFilter, true)
  }, [discordSync.syncNow, reload, categoryFilter])

  // Cambiar de máquina: deslizar el gabinete hacia el lado del botón pulsado
  const changeMachine = useCallback((dir: 'left' | 'right') => {
    const idx = availableMachines.findIndex((m) => m.key === categoryFilter)
    const current = idx === -1 ? 0 : idx
    const nextIdx = dir === 'right'
      ? (current + 1) % availableMachines.length
      : (current - 1 + availableMachines.length) % availableMachines.length
    const key = availableMachines[nextIdx].key
    setSlideDir(dir)
    setCategoryFilter(key)
    payout.resetSession()
    reload(key, true)
  }, [availableMachines, categoryFilter, payout.resetSession, reload])

  const openHistory = useCallback(async () => {
    setHistoryOpen(true)
    await refreshHistory()
  }, [refreshHistory])

  const closeHistory = useCallback(() => setHistoryOpen(false), [])

  const handleAdminReset = useCallback(async (adminKey: string) => {
    if (!window.confirm('¿Resetear todas las cápsulas a PENDING? La máquina se rellenará con 30 premios.')) return
    setResetting(true)
    try {
      await resetMachine(adminKey)
      payout.resetSession()
      await reload(categoryFilter, true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resetear')
    } finally {
      setResetting(false)
    }
  }, [payout.resetSession, reload, categoryFilter])

  const handleDeleteTitle = useCallback(async (adminKey: string, id: string) => {
    await deleteTitleRequest(adminKey, id)
    payout.resetSession()
    await Promise.all([reload(categoryFilter, true), refreshHistory()])
  }, [payout.resetSession, reload, categoryFilter, refreshHistory])

  const handleCorrectTitle = useCallback(async (
    adminKey: string,
    id: string,
    category: string,
    queryTitle: string,
    year?: number,
  ): Promise<TitleCorrectionResult> => {
    const result = await correctTitleRequest(adminKey, id, category, queryTitle, year)
    payout.resetSession()
    await Promise.all([reload(categoryFilter, true), refreshHistory()])
    return result
  }, [payout.resetSession, reload, categoryFilter, refreshHistory])

  const handleAdminReshuffle = useCallback(async (adminKey: string, category: MachineTarget): Promise<ReshuffleResult | null> => {
    const scope = category === 'all' ? 'todas las máquinas' : `la máquina ${category}`
    if (!window.confirm(`¿Volver a sortear ${scope}? Se redistribuirán al azar los títulos pendientes y en máquina; los ya vistos y su historial se conservarán.`)) return null
    setReshuffling(true)
    try {
      const result = await reshuffleMachine(adminKey, category)
      payout.resetSession()
      await reload(categoryFilter, true)
      return result
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al sortear de nuevo')
      return null
    } finally {
      setReshuffling(false)
    }
  }, [payout.resetSession, reload, categoryFilter])

  const handleClearMachine = useCallback(async (adminKey: string, category: MachineTarget): Promise<ClearMachineResult | null> => {
    const scope = category === 'all' ? 'todas las máquinas' : `la máquina ${category}`
    if (!window.confirm(`¿Vaciar ${scope}? Los títulos que están en la máquina volverán a la cola (PENDING).`)) return null
    setClearing(category)
    try {
      const result = await clearMachineRequest(adminKey, category)
      payout.resetSession()
      await Promise.all([reload(categoryFilter, true), library.reload()])
      return result
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al vaciar la máquina')
      return null
    } finally {
      setClearing(null)
    }
  }, [payout.resetSession, reload, categoryFilter, library.reload])

  const handleSetTitleStatus = useCallback(async (adminKey: string, id: string, status: TitleStatus) => {
    await setTitleStatusRequest(adminKey, id, status)
    await Promise.all([reload(categoryFilter, true), library.reload()])
  }, [reload, categoryFilter, library.reload])

  const activeMachine = availableMachines.find((m) => m.key === categoryFilter) || availableMachines[0]

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
    reshuffling,
    clearing,
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
    handleAdminReshuffle,
    handleClearMachine,
    handleSetTitleStatus,
    handleDeleteTitle,
    handleCorrectTitle,
    openHistory,
    closeHistory,
    refreshHistory,
    syncDiscord,
    syncing: discordSync.syncing,
    lastSyncAdded: discordSync.lastAdded,
    lastSyncMessagesRead: discordSync.lastMessagesRead,
    syncBackfillComplete: discordSync.backfillComplete,
    syncRestartedForEmptyMedia: discordSync.restartedForEmptyMedia,
    lastSyncIgnored: discordSync.lastIgnored,
    lastSyncDiscarded: discordSync.lastDiscarded,
    lastSyncFailures: discordSync.lastFailures,
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