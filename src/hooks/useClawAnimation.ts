import { useCallback, useEffect, useRef } from 'react'
import { useAnimation } from 'framer-motion'
import { CHUTE_X } from '../constants/game'
import type { MutableRefObject } from 'react'

const MOVE_STEP = 3 // píxeles por tick del joystick
const CLAW_RIGHT_BOUND = 260 // límite derecho del riel del gancho

export function useClawAnimation(isIdleRef: MutableRefObject<boolean>) {
  const clawXControls = useAnimation()
  const clawYControls = useAnimation()
  const clawProngsControls = useAnimation()
  const grabbedCapsuleControls = useAnimation()

  const chuteX = CHUTE_X
  const currentClawX = useRef(chuteX)
  const moveInterval = useRef<number | null>(null)

  const startMoving = useCallback((dir: 'left' | 'right') => {
    if (!isIdleRef.current) return
    if (moveInterval.current) clearInterval(moveInterval.current)

    moveInterval.current = window.setInterval(() => {
      let nextX = currentClawX.current + (dir === 'right' ? MOVE_STEP : -MOVE_STEP)
      nextX = Math.max(chuteX, Math.min(CLAW_RIGHT_BOUND, nextX))

      currentClawX.current = nextX
      clawXControls.set({ x: nextX })
    }, 16)
  }, [isIdleRef, clawXControls, chuteX])

  const stopMoving = useCallback(() => {
    if (moveInterval.current) {
      clearInterval(moveInterval.current)
      moveInterval.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopMoving()
  }, [stopMoving])

  return {
    clawXControls,
    clawYControls,
    clawProngsControls,
    grabbedCapsuleControls,
    chuteX,
    currentClawX,
    startMoving,
    stopMoving,
  }
}