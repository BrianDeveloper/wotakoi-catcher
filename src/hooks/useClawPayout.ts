import { useCallback, useEffect, useRef, useState } from 'react'
import type { useAnimation } from 'framer-motion'
import { consumeCapsule } from '../lib/api'
import { simulatePacking } from '../lib/gamePhysics'
import type { AnimeEntry, CapsulePosition, MachineState } from '../types'
import type { MutableRefObject } from 'react'

type AnimationController = ReturnType<typeof useAnimation>

export interface ClawAnimationApi {
  clawXControls: AnimationController
  clawYControls: AnimationController
  clawProngsControls: AnimationController
  grabbedCapsuleControls: AnimationController
  chuteX: number
  currentClawX: MutableRefObject<number>
}

interface MachineDataApi {
  remaining: AnimeEntry[]
  positions: CapsulePosition[]
  setPositions: (positions: CapsulePosition[]) => void
  removeCapsule: (index: number) => void
  appendCapsule: (anime: AnimeEntry) => void
}

interface ClawPayoutOptions {
  anim: ClawAnimationApi
  machineData: MachineDataApi
  sessionStartedRef: MutableRefObject<boolean>
  isIdleRef: MutableRefObject<boolean>
}

export function useClawPayout({ anim, machineData, sessionStartedRef, isIdleRef }: ClawPayoutOptions) {
  const [dispensed, setDispensed] = useState<AnimeEntry | null>(null)
  const [grabbedAnime, setGrabbedAnime] = useState<AnimeEntry | null>(null)
  const [machineState, setMachineState] = useState<MachineState>('idle')
  const [modalAnime, setModalAnime] = useState<AnimeEntry | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  const { remaining, positions, setPositions, removeCapsule, appendCapsule } = machineData

  const isAnimating = useRef(false)
  const pendingNext = useRef<AnimeEntry | null>(null)
  const modalRef = useRef<AnimeEntry | null>(null)
  const replenishedRef = useRef(false)

  // Mantener modalRef sincronizado con modalAnime (para saber si la modal sigue abierta)
  useEffect(() => {
    modalRef.current = modalAnime
  }, [modalAnime])

  // El joystick solo debe responder con la máquina en reposo
  useEffect(() => {
    isIdleRef.current = machineState === 'idle'
  }, [machineState, isIdleRef])

  const resetSession = useCallback(() => {
    setModalAnime(null)
    setDispensed(null)
    setGrabbedAnime(null)
    setMachineState('idle')
    setIsShaking(false)
    pendingNext.current = null
    replenishedRef.current = false
  }, [])

  const handleShake = useCallback(() => {
    if (machineState !== 'idle' || isShaking || remaining.length === 0) return
    setIsShaking(true)

    // Apply explosive upward force to current positions
    const explosiveNodes = positions.map((pos) => ({
      ...pos,
      vx: (Math.random() - 0.5) * 30,
      vy: -15 - Math.random() * 20,
    }))

    const newPositions = simulatePacking(remaining.length, explosiveNodes)
    setPositions(newPositions)

    setTimeout(() => setIsShaking(false), 500)
  }, [machineState, positions, remaining.length, isShaking, setPositions])

  const handlePlay = useCallback(async () => {
    if (isAnimating.current || remaining.length === 0) return
    isAnimating.current = true

    // Find closest target to current claw position
    let targetIndex = -1
    let closestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const capsuleCenterX = positions[i].x + 20
      const dist = Math.abs(capsuleCenterX - anim.currentClawX.current)
      if (dist < closestDist) {
        closestDist = dist
        targetIndex = i
      }
    }

    const GRAB_THRESHOLD = 25 // max distance to successfully grab
    let picked: AnimeEntry | null = null
    let targetPos = { x: anim.currentClawX.current - 20, y: 220, rotation: 0 } // default empty drop

    if (targetIndex !== -1 && closestDist <= GRAB_THRESHOLD) {
      picked = remaining[targetIndex]
      targetPos = positions[targetIndex]
    }

    setGrabbedAnime(picked)

    // If picked, slightly adjust X to center perfectly on the capsule
    if (picked) {
      setMachineState('moving_x')
      await anim.clawXControls.start({
        x: targetPos.x + 20, // Move claw center exactly to capsule center
        transition: { duration: 0.3, ease: 'easeInOut' }
      })
    }

    // 2. Move Y down
    setMachineState('moving_y_down')
    await anim.clawYControls.start({
      height: picked ? targetPos.y - 20 : 200, // Arm length
      transition: { duration: 1.2, ease: 'easeIn' }
    })

    // 3. Grab
    setMachineState('grabbing')
    await anim.clawProngsControls.start({
      rotate: [0, -30], // Close prongs
      transition: { duration: 0.3 }
    })

    let nextRemaining = remaining

    if (picked) {
      // Remove from remaining pool immediately (it's in the claw now)
      nextRemaining = remaining.filter((_, i) => i !== targetIndex)
      removeCapsule(targetIndex)
      sessionStartedRef.current = true
      anim.grabbedCapsuleControls.set({ opacity: 1 }) // Show capsule in claw
    }

    // 4. Move Y up
    setMachineState('moving_y_up')

    await anim.clawYControls.start({
      height: 20, // Default short arm
      transition: { duration: 1.5, ease: 'easeInOut' }
    })

    // 5. Return to Chute
    setMachineState('returning')
    await anim.clawXControls.start({
      x: anim.chuteX,
      transition: { duration: 1.5, ease: 'easeInOut' }
    })
    anim.currentClawX.current = anim.chuteX // Reset user position state to chute

    // 6. Drop or release
    setMachineState('dropping')
    await anim.clawProngsControls.start({
      rotate: 0, // Open prongs
      transition: { duration: 0.3 }
    })

    if (picked) {
      // Animate capsule falling
      await anim.grabbedCapsuleControls.start({
        y: 200, // Fall distance
        opacity: 0,
        transition: { duration: 0.5, ease: 'easeIn' }
      })
      setDispensed(picked)
      setMachineState(nextRemaining.length === 0 ? 'empty' : 'dispensed')
    } else {
      // Failed to grab, reset to idle
      setMachineState('idle')
    }

    // Reset grabbed capsule for next time
    anim.grabbedCapsuleControls.set({ y: 0, opacity: 0 })
    isAnimating.current = false
  }, [remaining, positions, anim, removeCapsule, sessionStartedRef])

  const handleOpenCapsule = useCallback(() => {
    const opened = dispensed
    if (!opened) return

    // Abrir la modal INMEDIATAMENTE (sin bloquear por el backend)
    setModalAnime(opened)
    setDispensed(null)
    replenishedRef.current = false
    if (remaining.length === 0) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }

    // Registrar consumo en el backend en segundo plano (no bloquea la UI)
    const captureId = opened.id
    ;(async () => {
      try {
        const { next } = await consumeCapsule(captureId)
        pendingNext.current = next ?? null
        // Si la modal ya se cerró durante el fetch, reponer aquí (con guarda anti-duplicados)
        if (!modalRef.current && pendingNext.current && !replenishedRef.current) {
          appendCapsule(pendingNext.current)
          pendingNext.current = null
          replenishedRef.current = true
          setMachineState('idle')
        }
      } catch {
        pendingNext.current = null
      }
    })()
  }, [dispensed, remaining, appendCapsule])

  const handleCloseModal = useCallback(() => {
    setModalAnime(null)

    // Al cerrar, añadir la cápsula pendiente (con animación de caída)
    const hadNext = pendingNext.current !== null
    if (pendingNext.current && !replenishedRef.current) {
      const next = pendingNext.current
      appendCapsule(next)
      pendingNext.current = null
      replenishedRef.current = true
    }

    if (remaining.length === 0 && !hadNext) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }
  }, [remaining, appendCapsule])

  return {
    dispensed,
    grabbedAnime,
    machineState,
    modalAnime,
    isShaking,
    resetSession,
    handleShake,
    handlePlay,
    handleOpenCapsule,
    handleCloseModal,
  }
}