import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { SHADOWS } from '../../constants/theme'
import { CABINET_SHAKE, SLIDE_TRANSITION, slideExit, slideInitial } from '../../constants/animations'
import { ClawCabinet } from './ClawCabinet'

export function MachineSelector() {
  const { changeMachine, categoryFilter, slideDir, isShaking } = useClawMachine()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 480, justifyContent: 'center' }}>
      {/* Left: previous machine */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => changeMachine('left')}
        title="Máquina anterior"
        aria-label="Máquina anterior"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--c-machine-dark)',
          border: '3px solid var(--c-machine-light)',
          color: 'var(--c-text-main)',
          fontSize: 20,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 0 var(--c-machine-main), ${SHADOWS.insetLight}`,
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
        whileTap={{ scale: 0.9 }}
        onClick={() => changeMachine('right')}
        title="Máquina siguiente"
        aria-label="Máquina siguiente"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--c-machine-dark)',
          border: '3px solid var(--c-machine-light)',
          color: 'var(--c-text-main)',
          fontSize: 20,
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 0 var(--c-machine-main), ${SHADOWS.insetLight}`,
          padding: 0,
        }}
      >
        ▶
      </motion.button>
    </div>
  )
}