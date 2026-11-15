import { motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { SURFACES } from '../../constants/theme'
import { CAPSULE_DROP_TRANSITION } from '../../constants/animations'
import { CapsuleBall } from '../ui/CapsuleBall'
import { ClawMechanism } from './ClawMechanism'
import { AnimeBgCarousel } from './AnimeBgCarousel'

const THEME_DOME_BG: Record<string, React.CSSProperties | undefined> = {
  movie: {
    backgroundColor: '#200508',
    backgroundImage: [
      'radial-gradient(ellipse 60% 45% at 50% 28%, rgba(255,215,0,0.07), transparent 70%)',
      'repeating-linear-gradient(90deg, rgba(140,10,20,0.28) 0px, rgba(60,0,8,0.10) 24px, rgba(140,10,20,0.28) 48px)',
      'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
    ].join(','),
  },
  series: {
    backgroundImage: [
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, rgba(0,0,0,0.05) 1px 3px)',
      'radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.28) 100%)',
    ].join(','),
  },
}

export function CapsuleDome() {
  const { remaining, positions, categoryFilter, activeMachine } = useClawMachine()
  const t = activeMachine.theme

  return (
    <div className="glass-display" style={{
      height: 280,
      borderRadius: '8px 8px 0 0',
      borderBottom: 'none',
      background: t.domeBg,
      transition: 'background-color .4s ease',
    }}>
      <div className="claw-track" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        zIndex: 3
      }} />

      {categoryFilter === 'anime' && <AnimeBgCarousel />}
{THEME_DOME_BG[categoryFilter] && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          imageRendering: 'pixelated',
          ...THEME_DOME_BG[categoryFilter],
        }} />
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(var(--c-machine-dark) 2px, transparent 2px)',
        backgroundSize: '16px 16px'
      }} />

      {t.domeEffect === 'scanlines' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 4px)',
        }} />
      )}

      {/* Brillo de cristal (barrido diagonal animado) */}
      <div className="glass-shine" />

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
        </motion.div>
      ))}

      <ClawMechanism />
    </div>
  )
}