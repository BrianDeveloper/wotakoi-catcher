import { motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { categoryEmoji } from '../../lib/format'
import { SURFACES } from '../../constants/theme'
import { CAPSULE_DROP_TRANSITION } from '../../constants/animations'
import { CapsuleBall } from '../ui/CapsuleBall'
import { ClawMechanism } from './ClawMechanism'

export function CapsuleDome() {
  const { remaining, positions, categoryFilter } = useClawMachine()

  return (
    <div className="glass-display" style={{
      height: 280,
      borderRadius: '8px 8px 0 0',
      borderBottom: 'none',
    }}>
      <div className="claw-track" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        zIndex: 3
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(var(--c-machine-dark) 2px, transparent 2px)',
        backgroundSize: '16px 16px'
      }} />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 80,
        width: 8,
        height: 60,
        background: SURFACES.glassWash,
        border: '2px solid var(--c-machine-light)',
        borderBottom: 'none',
        borderRadius: '4px 4px 0 0',
        zIndex: 2
      }} />

      {remaining.map((anime, i) => (
        <motion.div
          key={anime.id}
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: positions[i].y, x: positions[i].x, rotate: positions[i].rotation, opacity: 1 }}
          transition={CAPSULE_DROP_TRANSITION}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <CapsuleBall color={anime.capsuleColor} size={40} />
          {categoryFilter === 'mix' && anime.category && (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: SURFACES.mixBadgeBg,
                border: `1px solid ${SURFACES.capsuleSeam}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                zIndex: 2,
              }}
            >
              {categoryEmoji(anime.category)}
            </div>
          )}
        </motion.div>
      ))}

      <ClawMechanism />
    </div>
  )
}