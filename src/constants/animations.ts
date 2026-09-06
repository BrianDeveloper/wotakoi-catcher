import type { Variants } from 'framer-motion'

export const MODAL_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

export const CABINET_SHAKE = {
  animate: { x: [-3, 3, -4, 4, -2, 2, 0], y: [1, -1, 2, -2, 1, -1, 0] },
  transition: { duration: 0.4 },
}

export const SLIDE_TRANSITION = { duration: 0.32, ease: 'easeInOut' as const }

export function slideInitial(dir: 'left' | 'right') {
  return { opacity: 0, x: dir === 'right' ? 90 : -90 }
}

export function slideExit(dir: 'left' | 'right') {
  return { opacity: 0, x: dir === 'right' ? -90 : 90 }
}

export const CAPSULE_DROP_TRANSITION = { type: 'spring' as const, bounce: 0.4, duration: 0.8 }

export const PRIZE_PULSE = {
  animate: { opacity: [1, 0, 1] },
  transition: { duration: 1.5, repeat: Infinity },
}