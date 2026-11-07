import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const BACKGROUNDS = [
  'radial-gradient(ellipse at 20% 30%, #7c3aed 0, transparent 55%), linear-gradient(135deg, #1e1b4b, #312e81)',
  'radial-gradient(ellipse at 75% 65%, #db2777 0, transparent 50%), linear-gradient(135deg, #312e81, #4c1d95)',
  'radial-gradient(ellipse at 45% 45%, #0891b2 0, transparent 55%), linear-gradient(135deg, #1e1b4b, #581c87)',
]
const SLIDE_TRANSITION = { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
const VEIL_COLOR = '#3b0764'
const VEIL_OPACITY = 0.35
const DRAWING_OPACITY = 1
const INTERVAL_MS = 7000

export function AnimeBgCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % BACKGROUNDS.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={SLIDE_TRANSITION}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: DRAWING_OPACITY,
            imageRendering: 'pixelated',
            background: BACKGROUNDS[index],
          }}
        />
      </AnimatePresence>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: VEIL_COLOR,
          opacity: VEIL_OPACITY,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}