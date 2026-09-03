import { useState, useCallback, useRef, useEffect } from 'react'
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnimeEntry {
  id: number
  title: string
  genre: string
  image: string
  synopsis: string
  capsuleColor: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ANIMES: AnimeEntry[] = [
  {
    id: 1,
    title: 'Wotakoi: Love is Hard for Otaku',
    genre: 'Romance / Slice of Life',
    image: 'https://i.pinimg.com/736x/4b/a0/07/4ba00791177b1177080bd5e6ad5bb1a9.jpg',
    synopsis: 'Narumi Momose, una otaku que oculta su pasión, reencuentra a su amigo de infancia Hirotaka Nifuji en su nuevo trabajo.',
    capsuleColor: '#f43f5e',
  },
  {
    id: 2,
    title: 'Spy × Family',
    genre: 'Acción / Comedia',
    image: 'https://i.pinimg.com/1200x/b3/18/ea/b318ead5ef5e6e2ce91e641480723b50.jpg',
    synopsis: 'Un espía de élite, un asesino profesional y una niña telepática forman una familia ficticia para una misión secreta.',
    capsuleColor: '#f59e0b',
  },
  {
    id: 3,
    title: 'Violet Evergarden',
    genre: 'Drama / Fantasía',
    image: 'https://i.pinimg.com/1200x/56/ac/61/56ac616086a4fbad1009dbb0336ce650.jpg',
    synopsis: 'Violet Evergarden, una ex-soldado que perdió sus brazos en la guerra, comienza a trabajar como escritora de cartas automemoria.',
    capsuleColor: '#3b82f6',
  },
  {
    id: 4,
    title: 'Kaguya-sama: Love is War',
    genre: 'Romance / Comedia',
    image: 'https://i.pinimg.com/736x/05/f6/65/05f6653544ab709981778478f2a002b9.jpg',
    synopsis: 'La presidenta del consejo estudiantil Kaguya Shinomiya y el vicepresidente Miyuki Shirogane están enamorados, pero ninguno quiere confesar primero.',
    capsuleColor: '#ec4899',
  },
  {
    id: 5,
    title: 'Frieren: Beyond Journey\'s End',
    genre: 'Aventura / Fantasía',
    image: 'https://i.pinimg.com/736x/ae/b8/1e/aeb81e901a22cd9b814671e1a4007c79.jpg',
    synopsis: 'Frieren, una maga élfica, emprende un viaje reflexionando sobre el valor del tiempo y los vínculos humanos.',
    capsuleColor: '#8b5cf6',
  },
  {
    id: 6,
    title: 'Oshi no Ko',
    genre: 'Drama / Misterio',
    image: 'https://i.pinimg.com/1200x/bb/b1/e0/bbb1e09e1b7eaa2d9799b2b2a25db465.jpg',
    synopsis: 'Tras descubrir que su madre idol fue asesinada, Aqua jura venganza mientras navega por el oscuro mundo del entretenimiento.',
    capsuleColor: '#06b6d4',
  },
  {
    id: 7,
    title: 'Bocchi the Rock!',
    genre: 'Música / Slice of Life',
    image: 'https://i.pinimg.com/736x/3f/77/2d/3f772d0d8fa4c6d9885651aedcdc3fd0.jpg',
    synopsis: 'Hitori Gotou, una chica extremadamente tímida y solitaria, sueña con ser guitarrista de rock y se une a una banda.',
    capsuleColor: '#10b981',
  },
  {
    id: 8,
    title: 'Dungeon Meshi',
    genre: 'Aventura / Fantasía',
    image: 'https://i.pinimg.com/736x/46/62/c9/4662c9969b5574988a62452cb2672290.jpg',
    synopsis: 'Laios y su grupo deciden cocinar y comer los monstruos del calabozo mientras rescatan a su hermana.',
    capsuleColor: '#f97316',
  },
]

// ─── Utility ─────────────────────────────────────────────────────────────────



const CAPSULE_RADIUS = 20
const BOUNDS = {
  minX: 88, // 80 (chute) + 8 (wall)
  maxX: 308, // 340 (cabinet) - 32 (padding) = 308
  minY: 0,
  maxY: 280, // Floor of the glass area
}

function simulatePacking(count: number, initialNodes?: any[]) {
  const nodes = initialNodes ? initialNodes.map(n => ({
    x: n.x + CAPSULE_RADIUS,
    y: n.y + CAPSULE_RADIUS,
    vx: n.vx || (Math.random() - 0.5) * 4,
    vy: n.vy || (Math.random() - 0.5) * 4,
    rotation: n.rotation,
  })) : Array.from({ length: count }).map(() => ({
    x: BOUNDS.minX + CAPSULE_RADIUS + Math.random() * (BOUNDS.maxX - BOUNDS.minX - CAPSULE_RADIUS * 2),
    y: Math.random() * 100, // Drop from top
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    rotation: Math.random() * 360,
  }))

  const iterations = 400
  const gravity = 0.8
  const damping = 0.7
  const restitution = 0.2

  for (let step = 0; step < iterations; step++) {
    for (let i = 0; i < count; i++) {
      let n = nodes[i]
      n.vy += gravity

      n.x += n.vx
      n.y += n.vy

      if (n.y + CAPSULE_RADIUS > BOUNDS.maxY) {
        n.y = BOUNDS.maxY - CAPSULE_RADIUS
        n.vy *= -restitution
        n.vx *= damping
      }

      if (n.x - CAPSULE_RADIUS < BOUNDS.minX) {
        n.x = BOUNDS.minX + CAPSULE_RADIUS
        n.vx *= -restitution
      }
      if (n.x + CAPSULE_RADIUS > BOUNDS.maxX) {
        n.x = BOUNDS.maxX - CAPSULE_RADIUS
        n.vx *= -restitution
      }
    }

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        let dx = nodes[j].x - nodes[i].x
        let dy = nodes[j].y - nodes[i].y
        let distSq = dx * dx + dy * dy
        let minDist = CAPSULE_RADIUS * 2
        if (distSq < minDist * minDist && distSq > 0) {
          let dist = Math.sqrt(distSq)
          let overlap = minDist - dist
          let nx = dx / dist
          let ny = dy / dist

          nodes[i].x -= nx * overlap * 0.5
          nodes[i].y -= ny * overlap * 0.5
          nodes[j].x += nx * overlap * 0.5
          nodes[j].y += ny * overlap * 0.5

          let dvx = nodes[j].vx - nodes[i].vx
          let dvy = nodes[j].vy - nodes[i].vy
          let dot = dvx * nx + dvy * ny
          if (dot < 0) {
            let impulse = dot * (1 + restitution) * 0.5
            nodes[i].vx += nx * impulse
            nodes[i].vy += ny * impulse
            nodes[j].vx -= nx * impulse
            nodes[j].vy -= ny * impulse
          }
        }
      }
    }
  }

  return nodes.map(n => ({
    x: n.x - CAPSULE_RADIUS,
    y: n.y - CAPSULE_RADIUS,
    rotation: n.rotation,
  }))
}

function generateCapsulePositions(count: number) {
  return simulatePacking(count)
}

// ─── Capsule Component ────────────────────────────────────────────────────────

interface CapsuleProps {
  color: string
  size?: number
  style?: React.CSSProperties
}

// Cápsula estilo japonés: Abajo de color, Arriba transparente
function CapsuleBall({ color, size = 36, style }: CapsuleProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
        ...style,
      }}
    >
      {/* Bottom Half (Colored) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: color,
        borderTop: '2px solid rgba(0,0,0,0.1)',
      }} />

      {/* Top Half (Transparent/Glass) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(2px)',
      }} />

      {/* Reflection Highlight */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '30%',
        height: '25%',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '50%',
        filter: 'blur(1px)',
        transform: 'rotate(-45deg)',
      }} />

      {/* Middle seam/band */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.5)',
        transform: 'translateY(-50%)',
      }} />
    </div>
  )
}

// ─── Modal Component ──────────────────────────────────────────────────────────

interface CapsuleModalProps {
  anime: AnimeEntry
  onClose: () => void
}

const modalVariants: Variants = {
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

function CapsuleModal({ anime, onClose }: CapsuleModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="modal-card"
        style={{
          borderRadius: 24,
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ padding: '24px' }}>
          {/* Cover image */}
          <div
            onClick={() => setIsFullscreen(true)}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 20,
              height: 220,
              position: 'relative',
              border: `4px solid ${anime.capsuleColor}`,
              cursor: 'zoom-in'
            }}
          >
            <img
              src={anime.image}
              alt={anime.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)'
            }}>
              🔍 Ver completa
            </div>
          </div>

          {/* Title & genre */}
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <div className="genre-badge" style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              {anime.genre}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.25,
            }}>
              {anime.title}
            </h2>
          </div>

          {/* Synopsis */}
          <p style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--c-text-light)',
            textAlign: 'center',
          }}>
            {anime.synopsis}
          </p>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{
              marginTop: 24,
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              background: anime.capsuleColor,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 4px 15px ${anime.capsuleColor}88`,
            }}
          >
            <Sparkles size={18} />
            Cerrar
          </motion.button>
        </div>
      </motion.div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreen(false)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              cursor: 'zoom-out'
            }}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={anime.image}
              alt={anime.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: `0 0 30px ${anime.capsuleColor}66`
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Claw Machine Component ───────────────────────────────────────────────────

type MachineState = 'idle' | 'moving_x' | 'moving_y_down' | 'grabbing' | 'moving_y_up' | 'returning' | 'dropping' | 'dispensed' | 'empty'

export default function ClawMachineViewer() {
  const [remaining, setRemaining] = useState<AnimeEntry[]>([...MOCK_ANIMES])
  const [positions, setPositions] = useState<{ x: number, y: number, rotation: number }[]>(() => generateCapsulePositions(MOCK_ANIMES.length))

  const [dispensed, setDispensed] = useState<AnimeEntry | null>(null)
  const [grabbedAnime, setGrabbedAnime] = useState<AnimeEntry | null>(null)
  const [machineState, setMachineState] = useState<MachineState>('idle')
  const [modalAnime, setModalAnime] = useState<AnimeEntry | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  // Animation controllers
  const clawXControls = useAnimation()
  const clawYControls = useAnimation()
  const clawProngsControls = useAnimation()
  const grabbedCapsuleControls = useAnimation()

  const isAnimating = useRef(false)
  const chuteX = 40 // X position of the drop chute
  const currentClawX = useRef(chuteX)
  const moveInterval = useRef<number | null>(null)

  const startMoving = useCallback((dir: 'left' | 'right') => {
    if (machineState !== 'idle') return
    if (moveInterval.current) clearInterval(moveInterval.current)

    moveInterval.current = window.setInterval(() => {
      const step = 3 // speed
      let nextX = currentClawX.current + (dir === 'right' ? step : -step)
      nextX = Math.max(chuteX, Math.min(260, nextX))

      currentClawX.current = nextX
      clawXControls.set({ x: nextX })
    }, 16)
  }, [machineState, clawXControls, chuteX])

  const stopMoving = useCallback(() => {
    if (moveInterval.current) {
      clearInterval(moveInterval.current)
      moveInterval.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopMoving()
  }, [stopMoving])

  const handleShake = useCallback(() => {
    if (machineState !== 'idle' || isShaking || remaining.length === 0) return
    setIsShaking(true)

    // Apply explosive upward force to current positions
    const explosiveNodes = positions.map(pos => ({
      ...pos,
      vx: (Math.random() - 0.5) * 30,
      vy: -15 - Math.random() * 20,
    }))

    const newPositions = simulatePacking(remaining.length, explosiveNodes)
    setPositions(newPositions)

    setTimeout(() => setIsShaking(false), 500)
  }, [machineState, positions, remaining.length, isShaking])

  const handlePlay = useCallback(async () => {
    if (isAnimating.current || remaining.length === 0) return
    isAnimating.current = true

    // Find closest target to current claw position
    let targetIndex = -1
    let closestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const capsuleCenterX = positions[i].x + 20
      const dist = Math.abs(capsuleCenterX - currentClawX.current)
      if (dist < closestDist) {
        closestDist = dist
        targetIndex = i
      }
    }

    const GRAB_THRESHOLD = 25 // max distance to successfully grab
    let picked: AnimeEntry | null = null
    let targetPos = { x: currentClawX.current - 20, y: 220, rotation: 0 } // default empty drop

    if (targetIndex !== -1 && closestDist <= GRAB_THRESHOLD) {
      picked = remaining[targetIndex]
      targetPos = positions[targetIndex]
    }

    setGrabbedAnime(picked)

    // If picked, slightly adjust X to center perfectly on the capsule
    if (picked) {
      setMachineState('moving_x')
      await clawXControls.start({
        x: targetPos.x + 20, // Move claw center exactly to capsule center
        transition: { duration: 0.3, ease: 'easeInOut' }
      })
    }

    // 2. Move Y down
    setMachineState('moving_y_down')
    await clawYControls.start({
      height: picked ? targetPos.y - 20 : 200, // Arm length
      transition: { duration: 1.2, ease: 'easeIn' }
    })

    // 3. Grab
    setMachineState('grabbing')
    await clawProngsControls.start({
      rotate: [0, -30], // Close prongs
      transition: { duration: 0.3 }
    })

    let nextRemaining = remaining
    let nextPositions = positions

    if (picked) {
      // Remove from remaining pool immediately (it's in the claw now)
      nextRemaining = remaining.filter((_, i) => i !== targetIndex)
      nextPositions = positions.filter((_, i) => i !== targetIndex)
      setRemaining(nextRemaining)
      setPositions(nextPositions)
      grabbedCapsuleControls.set({ opacity: 1 }) // Show capsule in claw
    }

    // 4. Move Y up
    setMachineState('moving_y_up')

    await clawYControls.start({
      height: 20, // Default short arm
      transition: { duration: 1.5, ease: 'easeInOut' }
    })

    // 5. Return to Chute
    setMachineState('returning')
    await clawXControls.start({
      x: chuteX,
      transition: { duration: 1.5, ease: 'easeInOut' }
    })
    currentClawX.current = chuteX // Reset user position state to chute

    // 6. Drop or release
    setMachineState('dropping')
    await clawProngsControls.start({
      rotate: 0, // Open prongs
      transition: { duration: 0.3 }
    })

    if (picked) {
      // Animate capsule falling
      await grabbedCapsuleControls.start({
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
    grabbedCapsuleControls.set({ y: 0, opacity: 0 })
    isAnimating.current = false
  }, [remaining, positions, clawXControls, clawYControls, clawProngsControls, grabbedCapsuleControls, chuteX])

  const handleOpenCapsule = useCallback(() => {
    if (!dispensed) return
    setModalAnime(dispensed)
    setDispensed(null)
    if (remaining.length === 0) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }
  }, [dispensed, remaining])

  const handleCloseModal = useCallback(() => {
    setModalAnime(null)
    if (remaining.length === 0 && dispensed === null) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }
  }, [remaining, dispensed])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px 40px',
    }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(32px, 6vw, 42px)',
          fontWeight: 900,
          color: 'var(--c-text-main)',
          textShadow: '2px 2px 0px var(--c-machine-dark), 4px 4px 0px var(--c-machine-light)',
          letterSpacing: '2px'
        }}>
          WOTAKOI-CATCHER
        </h1>
        <p style={{ margin: '8px 0 0', fontWeight: 700, color: 'var(--c-text-light)' }}>
          ¡Descubre tu próximo anime!
        </p>
      </div>

      {/* Main Machine */}
      <motion.div
        animate={isShaking ? { x: [-3, 3, -4, 4, -2, 2, 0], y: [1, -1, 2, -2, 1, -1, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 340,
          position: 'relative'
        }}>

        {/* Top Cabinet */}
        <div className="machine-cabinet" style={{
          padding: '16px 16px 0',
          position: 'relative',
        }}>
          {/* Header Marquee */}
          <div style={{
            background: 'var(--c-machine-dark)',
            borderRadius: 8,
            padding: '6px',
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '2px solid var(--c-machine-light)'
          }}>
            <Star size={14} color="var(--c-machine-accent)" fill="var(--c-machine-accent)" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-text-main)' }}>
              {remaining.length} PREMIOS
            </span>
            <Star size={14} color="var(--c-machine-accent)" fill="var(--c-machine-accent)" />
          </div>

          {/* Glass Area */}
          <div className="glass-display" style={{
            height: 280,
            borderRadius: '8px 8px 0 0',
            borderBottom: 'none',
          }}>
            {/* Ceiling Track */}
            <div className="claw-track" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 12,
              zIndex: 3
            }} />

            {/* Background pattern */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(var(--c-machine-dark) 2px, transparent 2px)',
              backgroundSize: '16px 16px'
            }} />

            {/* Left Chute Wall */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 80,
              width: 8,
              height: 60,
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid var(--c-machine-light)',
              borderBottom: 'none',
              borderRadius: '4px 4px 0 0',
              zIndex: 2
            }} />

            {/* Capsules on the floor */}
            {remaining.map((anime, i) => (
              <motion.div
                key={anime.id}
                initial={{ y: -200, opacity: 0 }}
                animate={{ y: positions[i].y, x: positions[i].x, rotate: positions[i].rotation, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
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

            {/* The Claw Mechanism */}
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
                marginLeft: -20 // center on X coordinate
              }}
            >
              {/* Motor Unit */}
              <div style={{
                width: 24,
                height: 16,
                background: '#ccc',
                border: '2px solid #999',
                borderRadius: 4
              }} />

              {/* Arm / Cable */}
              <motion.div
                animate={clawYControls}
                initial={{ height: 20 }}
                style={{
                  width: 4,
                  background: '#666',
                  originY: 0
                }}
              />

              {/* Claw Head */}
              <div style={{
                width: 20,
                height: 12,
                background: '#fff',
                border: '2px solid #ccc',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center'
              }}>
                {/* Left Prong */}
                <motion.div
                  animate={clawProngsControls}
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 2,
                    width: 4,
                    height: 24,
                    background: '#ccc',
                    borderRadius: 2,
                    originY: 0,
                    originX: 1,
                    rotate: 15
                  }}
                />
                {/* Right Prong */}
                <motion.div
                  animate={clawProngsControls}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 2,
                    width: 4,
                    height: 24,
                    background: '#ccc',
                    borderRadius: 2,
                    originY: 0,
                    originX: 0,
                    rotate: -15
                  }}
                />

                {/* Grabbed Capsule */}
                <motion.div
                  animate={grabbedCapsuleControls}
                  initial={{ opacity: 0, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 18,
                    zIndex: -1
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
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel" style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 80
        }}>
          {/* Movement Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <motion.button
              whileTap={machineState === 'idle' ? { scale: 0.9, y: 4 } : {}}
              onMouseDown={() => startMoving('left')}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={() => startMoving('left')}
              onTouchEnd={stopMoving}
              onTouchCancel={stopMoving}
              disabled={machineState !== 'idle'}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: machineState === 'idle' ? '#a855f7' : '#475569',
                border: '3px solid #7e22ce',
                color: '#fff',
                fontSize: 20,
                cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
                boxShadow: machineState === 'idle' ? '0 4px 0 #7e22ce, inset 0 2px 0 rgba(255,255,255,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              ◀
            </motion.button>
            <motion.button
              whileTap={machineState === 'idle' ? { scale: 0.9, y: 4 } : {}}
              onMouseDown={() => startMoving('right')}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={() => startMoving('right')}
              onTouchEnd={stopMoving}
              onTouchCancel={stopMoving}
              disabled={machineState !== 'idle'}
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: machineState === 'idle' ? '#a855f7' : '#475569',
                border: '3px solid #7e22ce',
                color: '#fff',
                fontSize: 20,
                cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
                boxShadow: machineState === 'idle' ? '0 4px 0 #7e22ce, inset 0 2px 0 rgba(255,255,255,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              ▶
            </motion.button>
          </div>

          {/* Status Text */}
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--c-text-main)',
            textTransform: 'uppercase',
            textAlign: 'center',
            letterSpacing: '1px'
          }}>
            {machineState === 'idle' && remaining.length > 0 && '¡PRESIONA GO!'}
            {machineState !== 'idle' && machineState !== 'dispensed' && machineState !== 'empty' && 'PLAYING...'}
            {machineState === 'dispensed' && '¡PREMIO!'}
            {machineState === 'empty' && 'AGOTADO'}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Shake Button */}
            <motion.button
              whileTap={machineState === 'idle' && !isShaking ? { scale: 0.9, y: 4 } : {}}
              onClick={handleShake}
              disabled={machineState !== 'idle' || isShaking || remaining.length === 0}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: machineState === 'idle' && !isShaking ? '#f59e0b' : '#64748b',
                border: '3px solid #b45309',
                color: '#fff',
                cursor: machineState === 'idle' && !isShaking ? 'pointer' : 'not-allowed',
                boxShadow: machineState === 'idle' && !isShaking ? '0 4px 0 #b45309, inset 0 2px 0 rgba(255,255,255,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0
              }}
            >
              <span style={{ fontSize: 18 }}>🔄️</span>
            </motion.button>

            {/* Big Play Button */}
            <button
              className={`play-button ${machineState !== 'idle' ? 'active' : ''}`}
              disabled={machineState !== 'idle' || remaining.length === 0}
              onClick={handlePlay}
              style={{
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>GO</span>
            </button>
          </div>
        </div>

        {/* Machine Base & Prize Dispenser */}
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
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
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
              background: '#555',
              border: '2px solid #333',
              borderRadius: 4,
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: 60,
              marginBottom: 10
            }}>
              <div style={{ width: 4, height: 20, background: '#222', borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: '#aaa', fontWeight: 800 }}>100¥</span>
            </div>

            <p style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              opacity: 0.8
            }}>
              {machineState === 'dispensed' ? '↑ ¡Toca tu premio!' : 'Inserta una moneda y presiona GO!'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <p style={{
        marginTop: 30,
        fontSize: 12,
        color: 'var(--c-text-light)',
        fontWeight: 700,
      }}>
        © Wotakoi Arcade
      </p>

      {/* Modal */}
      <AnimatePresence>
        {modalAnime && (
          <CapsuleModal
            anime={modalAnime}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
