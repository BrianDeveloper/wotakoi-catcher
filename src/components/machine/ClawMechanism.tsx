import { motion } from 'framer-motion'
import type { TargetAndTransition } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { METAL } from '../../constants/theme'
import { CapsuleBall } from '../ui/CapsuleBall'

// Apertura y cierre de las tenazas (volumen del gancho cónico y cerrado sobre la cápsula)
const OPEN = { left: -25, right: 25, back: -8 } as const
const CLOSED = { left: -5, right: 5, back: -2 } as const

// Transiciones de longitud del cable (igual a las del payout para no desincronizar)
const PRONG_IN = { duration: 0.3, ease: 'easeInOut' } as const
const PRONG_OUT = { duration: 0.4, ease: 'easeInOut' } as const

// Gradientes SVG (cromo pulido + piezas oscuras)
const CHROME = {
  body: 'url(#wm-chrome)',
  dark: 'url(#wm-chrome-dark)',
  prong: 'url(#wm-prong)',
  screw: 'url(#wm-screw)',
  pulley: 'url(#wm-pulley)',
}

export function ClawMechanism() {
  const {
    clawXControls,
    clawYControls,
    grabbedCapsuleControls,
    grabbedAnime,
    chuteX,
    machineState,
  } = useClawMachine()

  // Tenazas cerradas al sujetar y al transportar (abiertas el resto del ciclo)
  const holding = machineState === 'grabbing' || machineState === 'moving_y_up' || machineState === 'returning'
  const shake = machineState === 'grabbing'
  // LED parpadea durante descenso/agarre y al regresar con premio
  const busy = machineState !== 'idle' && machineState !== 'dispensed' && machineState !== 'empty'

  const leftPose: TargetAndTransition = shake
    ? { rotate: [OPEN.left, CLOSED.left, CLOSED.left - 4, CLOSED.left], transition: { duration: 0.35, ease: 'easeInOut' } }
    : holding
      ? { rotate: CLOSED.left, transition: PRONG_IN }
      : { rotate: OPEN.left, transition: PRONG_OUT }

  const rightPose: TargetAndTransition = shake
    ? { rotate: [OPEN.right, CLOSED.right, CLOSED.right + 4, CLOSED.right], transition: { duration: 0.35, ease: 'easeInOut' } }
    : holding
      ? { rotate: CLOSED.right, transition: PRONG_IN }
      : { rotate: OPEN.right, transition: PRONG_OUT }

  const backPose: TargetAndTransition = shake
    ? { rotate: [OPEN.back, CLOSED.back, CLOSED.back - 2, CLOSED.back], transition: { duration: 0.35, ease: 'easeInOut' } }
    : holding
      ? { rotate: CLOSED.back, transition: PRONG_IN }
      : { rotate: OPEN.back, transition: PRONG_OUT }

  const ledColor = busy ? METAL.led.busy : METAL.led.idle

  return (
    <motion.div
      animate={clawXControls}
      initial={{ x: chuteX }}
      style={{
        position: 'absolute',
        top: 12,
        left: 0,
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 4,
        marginLeft: -20, // centrar sobre la coordenada X
        filter: 'drop-shadow(2px 3px 3px rgba(0,0,0,0.45))',
      }}
    >
      {/* 1. Cable metálico extensible (con textura de eslabones) */}
      <motion.div
        data-claw="cable"
        animate={clawYControls}
        initial={{ height: 20 }}
        style={{
          width: 5,
          originY: 0,
          borderRadius: 3,
          backgroundImage:
            `repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 3px, transparent 3px 6px), ` +
            `linear-gradient(90deg, ${METAL.cable[0]}, ${METAL.cable[1]} 35%, ${METAL.cable[2]} 65%, ${METAL.cable[3]})`,
        }}
      />

      {/* Cabezal (motor + polea) y tenazas + cápsula: subárbol que viaja junto al cable */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
      {/* 2. Bloque motor / caja de polea con LED de estado */}
      <svg data-claw="motor" width={46} height={22} viewBox="0 0 46 22">
        <defs>
          <linearGradient id="wm-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METAL.chrome.high} />
            <stop offset="35%" stopColor={METAL.chrome.mid} />
            <stop offset="70%" stopColor={METAL.chrome.body} />
            <stop offset="100%" stopColor={METAL.chrome.edge} />
          </linearGradient>
          <linearGradient id="wm-chrome-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={METAL.chrome.mid} />
            <stop offset="100%" stopColor={METAL.chrome.edge} />
          </linearGradient>
          <linearGradient id="wm-prong" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={METAL.chrome.high} />
            <stop offset="45%" stopColor={METAL.chrome.mid} />
            <stop offset="80%" stopColor={METAL.chrome.low} />
            <stop offset="100%" stopColor={METAL.chrome.edge} />
          </linearGradient>
          <radialGradient id="wm-screw">
            <stop offset="0%" stopColor={METAL.chrome.high} />
            <stop offset="100%" stopColor={METAL.chrome.edge} />
          </radialGradient>
          <radialGradient id="wm-pulley">
            <stop offset="0%" stopColor={METAL.chrome.high} />
            <stop offset="70%" stopColor={METAL.chrome.body} />
            <stop offset="100%" stopColor={METAL.chrome.edge} />
          </radialGradient>
        </defs>

        {/* Chasis redondeado */}
        <rect x="1" y="2" width="44" height="18" rx="6" fill={CHROME.body} stroke={METAL.chrome.edge} />
        <rect x="1" y="2" width="44" height="4" rx="2" fill={METAL.chrome.high} opacity="0.8" />
        <rect x="6" y="6" width="25" height="10" rx="3" fill={CHROME.dark} />

        {/* Polea */}
        <circle cx="18.5" cy="11" r="5" fill={CHROME.pulley} stroke={METAL.chrome.edge} strokeWidth="1.5" />
        <circle cx="18.5" cy="11" r="1.6" fill={METAL.chrome.edge} />

        {/* Tornillos */}
        <circle cx="7" cy="5" r="1.8" fill={CHROME.screw} />
        <circle cx="7" cy="17" r="1.8" fill={CHROME.screw} />
        <circle cx="39" cy="5" r="1.8" fill={CHROME.screw} />
        <circle cx="39" cy="17" r="1.8" fill={CHROME.screw} />

        {/* LED de estado */}
        <circle data-claw="led" cx="40" cy="11" r="4" fill={ledColor} opacity="0.3" />
        <motion.circle
          cx="40"
          cy="11"
          r="2.6"
          fill={ledColor}
          animate={busy ? { opacity: [1, 0.15, 1] } : { opacity: 1 }}
          transition={busy ? { duration: 0.55, repeat: Infinity } : { duration: 0.2 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      </svg>

      {/* 3. Tenazas curvas articuladas (izquierda, derecha y centro-posterior) */}
      <svg data-claw="prongs" width={44} height={28} viewBox="0 0 44 28" style={{ overflow: 'visible' }}>
        {/* Tenaza central posterior (más oscura, detrás) */}
        <motion.g
          data-claw="back"
          animate={backPose}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
        >
          <path
            d="M 22 1 C 23 9 21 16 22 25"
            stroke={CHROME.prong}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </motion.g>

        {/* Tenaza izquierda (curva hacia adentro) */}
        <motion.g
          data-claw="left"
          animate={leftPose}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
        >
          <path
            d="M 15 1 C 12 9 5.5 14 8 22 C 9.4 25.5 13.5 27.5 15.5 25"
            stroke={CHROME.prong}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Tenaza derecha (curva hacia adentro) */}
        <motion.g
          data-claw="right"
          animate={rightPose}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
        >
          <path
            d="M 29 1 C 32 9 38.5 14 36 22 C 34.6 25.5 30.5 27.5 28.5 25"
            stroke={CHROME.prong}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>
      </svg>

      {/* 4. Cápsula agarrada (anclada al cabezal: sube y baja al ritmo de la garra) */}
      <motion.div
        data-claw="grab-capsule"
        animate={grabbedCapsuleControls}
        initial={{ opacity: 0, y: 0 }}
        style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          width: 40,
          marginLeft: -20,
          zIndex: -1,
        }}
      >
        {grabbedAnime ? (
          <CapsuleBall color={grabbedAnime.capsuleColor} size={40} />
        ) : (
          <CapsuleBall color="transparent" size={40} />
        )}
      </motion.div>
      </div>
    </motion.div>
  )
}