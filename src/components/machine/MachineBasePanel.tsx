import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { COIN_SLOT, STATE_COLORS } from '../../constants/theme'
import { PRIZE_PULSE } from '../../constants/animations'
import { CapsuleBall } from '../ui/CapsuleBall'

export function MachineBasePanel() {
  const { dispensed, machineState, handleOpenCapsule } = useClawMachine()

  return (
    <div className="machine-base" style={{
      height: 100,
      padding: '12px 20px',
      display: 'flex',
      gap: '20px'
    }}>
      {/* Prize Chute Outlet */}
      <div className="prize-chute" style={{
        width: 80,
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 8
      }}>
        <AnimatePresence>
          {dispensed && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenCapsule}
              style={{ cursor: 'pointer' }}
            >
              <CapsuleBall color={dispensed.capsuleColor} size={48} />
              <motion.div
                animate={PRIZE_PULSE.animate}
                transition={PRIZE_PULSE.transition}
                style={{
                  position: 'absolute',
                  inset: -4,
                  border: `2px solid ${dispensed.capsuleColor}`,
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Coin Slot / Instructions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          background: COIN_SLOT.bg,
          border: `2px solid ${COIN_SLOT.border}`,
          borderRadius: 4,
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: 60,
          marginBottom: 10
        }}>
          <div style={{ width: 4, height: 20, background: COIN_SLOT.divider, borderRadius: 2 }} />
          <span style={{ fontSize: 9, color: COIN_SLOT.text, fontWeight: 800 }}>100¥</span>
        </div>

        <p style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          color: STATE_COLORS.white,
          opacity: 0.8
        }}>
          {machineState === 'dispensed' ? '↑ ¡Toca tu premio!' : 'Inserta una moneda y presiona GO!'}
        </p>
      </div>
    </div>
  )
}