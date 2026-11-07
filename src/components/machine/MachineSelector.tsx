import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { CABINET_SHAKE, SLIDE_TRANSITION, slideExit, slideInitial } from '../../constants/animations'
import { ClawCabinet } from './ClawCabinet'

export function MachineSelector() {
  const { changeMachine, categoryFilter, slideDir, isShaking } = useClawMachine()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 480, justifyContent: 'center' }}>
      {/* Left: previous machine */}
      <motion.button
whileHover={{ y: -2 }}
          whileTap={{ y: 2, scale: 0.92 }}
          onClick={() => changeMachine('left')}
          title="Máquina anterior"
          aria-label="Máquina anterior"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'color-mix(in srgb, var(--c-machine-dark) 55%, transparent)',
            border: '2px solid color-mix(in srgb, var(--c-machine-accent) 65%, transparent)',
            color: 'var(--c-machine-light)',
            fontSize: 20,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px 1px color-mix(in srgb, var(--c-machine-accent) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: 0,
          }}
      >
        ◀
      </motion.button>

      {/* Main Machine */}
      <AnimatePresence mode="wait">
        <motion.div
          key={categoryFilter}
          initial={slideInitial(slideDir)}
          animate={{ opacity: 1, x: 0 }}
          exit={slideExit(slideDir)}
          transition={SLIDE_TRANSITION}
          style={{ width: '100%', maxWidth: 340, display: 'flex', justifyContent: 'center' }}
        >
          <motion.div
            animate={isShaking ? CABINET_SHAKE.animate : {}}
            transition={CABINET_SHAKE.transition}
            style={{
              width: '100%',
              maxWidth: 340,
              position: 'relative'
            }}
          >
            <ClawCabinet />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Right: next machine */}
      <motion.button
whileHover={{ y: -2 }}
          whileTap={{ y: 2, scale: 0.92 }}
          onClick={() => changeMachine('right')}
          title="Máquina siguiente"
          aria-label="Máquina siguiente"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'color-mix(in srgb, var(--c-machine-dark) 55%, transparent)',
            border: '2px solid color-mix(in srgb, var(--c-machine-accent) 65%, transparent)',
            color: 'var(--c-machine-light)',
            fontSize: 20,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px 1px color-mix(in srgb, var(--c-machine-accent) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: 0,
          }}
      >
        ▶
      </motion.button>
    </div>
  )
}