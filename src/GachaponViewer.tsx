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
  id: string
  title: string
  genre: string
  allGenres?: string
  image: string
  synopsis: string
  capsuleColor: string
  category?: string
  consumedAt?: string
}

type MachineKey = 'anime' | 'movie' | 'series' | 'mix'

interface MachineDef {
  key: MachineKey
  label: string
  short: string
  emoji: string
  accent: string
  main: string
  dark: string
  light: string
}

const MACHINES: MachineDef[] = [
  { key: 'anime', label: 'Máquina Anime', short: 'ANIME', emoji: '🍥',
    accent: '#22d3ee', main: '#a21caf', dark: '#701a75', light: '#ec4899' },
  { key: 'movie', label: 'Máquina Películas', short: 'PELIS', emoji: '🎬',
    accent: '#f59e0b', main: '#991b1b', dark: '#7f1d1d', light: '#fbbf24' },
  { key: 'series', label: 'Máquina Series', short: 'SERIES', emoji: '📺',
    accent: '#a3e635', main: '#166534', dark: '#14532d', light: '#4ade80' },
  { key: 'mix', label: 'Máquina Mix', short: 'MIX', emoji: '👾',
    accent: '#22d3ee', main: '#3b0764', dark: '#1e1b4b', light: '#9333ea' },
]

const MACHINE_QUERY_PARAM: Record<MachineKey, string> = {
  anime: 'anime',
  movie: 'movie',
  series: 'series',
  mix: 'mix',
}

// ─── Utility ─────────────────────────────────────────────────────────────────



const MACHINE_URL = 'http://localhost:4000/api/machine/capsules'
const CONSUME_URL = 'http://localhost:4000/api/capsules'
const RESET_URL = 'http://localhost:4000/api/admin/reset'
const HISTORY_URL = 'http://localhost:4000/api/history'
const ADMIN_SECRET_KEY = '65f4d8c6989f4c02b6b44da2e438f506'
const REFRESH_INTERVAL_MIN = 60
const CAPSULE_LIMIT = 30

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

async function fetchAnimes(category: MachineKey): Promise<{ capsules: AnimeEntry[]; category: string }> {
  const url = `${MACHINE_URL}?category=${MACHINE_QUERY_PARAM[category]}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchHistory(): Promise<AnimeEntry[]> {
  const res = await fetch(HISTORY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.history || []
}

function categoryEmoji(category?: string) {
  switch (category) {
    case 'anime': return '🍥'
    case 'movie': return '🎬'
    case 'series': return '📺'
    default: return '👾'
  }
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
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const synopsisLong = anime.synopsis.length > 160

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
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="modal-scroll-hidden"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: '1 1 auto',
            scrollbarWidth: 'none',
          } as unknown as React.CSSProperties}
        >
          {/* Cover image */}
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
          <p
            className="synopsis-scroll-hidden"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--c-text-light)',
              textAlign: 'center',
              ...(synopsisExpanded
                ? {
                    maxHeight: 160,
                    overflowY: 'auto',
                    paddingRight: 8,
                    scrollbarWidth: 'none',
                  }
                : {
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                    overflow: 'hidden',
                  }),
            } as unknown as React.CSSProperties}
          >
            {anime.synopsis}
          </p>

          {synopsisLong && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSynopsisExpanded((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--c-accent, #f43f5e)',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '4px 8px',
                }}
              >
                {synopsisExpanded ? 'Ver menos' : 'Ver más'}
              </motion.button>
            </div>
          )}

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
  const [remaining, setRemaining] = useState<AnimeEntry[]>([])
  const [positions, setPositions] = useState<{ x: number, y: number, rotation: number }[]>([])
  const [categoryFilter, setCategoryFilter] = useState<MachineKey>('anime')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadAnimes = useCallback(async (category: MachineKey, force = false) => {
    try {
      const data = await fetchAnimes(category)
      if (data.capsules) {
        // No romper la sesión activa salvo que sea un cambio forzado (montaje / cambio de máquina)
        if (sessionStarted.current && !force) {
          setLoading(false)
          return
        }
        const pool = data.capsules.slice(0, CAPSULE_LIMIT)
        setRemaining(pool)
        setPositions(generateCapsulePositions(pool.length))
        setLoadError(null)
      }
      setLoading(false)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error de conexión')
      setLoading(false)
    }
  }, [])

  // Cargar la máquina activa al montar y cada cierto tiempo
  useEffect(() => {
    loadAnimes(categoryFilter, true)
    const id = window.setInterval(() => loadAnimes(categoryFilter, false), REFRESH_INTERVAL_MIN * 60 * 1000)
    return () => window.clearInterval(id)
  }, [loadAnimes, categoryFilter])

  // Cambiar de máquina: deslizar el gabinete hacia el lado del botón pulsado
  const changeMachine = useCallback((dir: 'left' | 'right') => {
    const idx = MACHINES.findIndex((m) => m.key === categoryFilter)
    const nextIdx = dir === 'right'
      ? (idx + 1) % MACHINES.length
      : (idx - 1 + MACHINES.length) % MACHINES.length
    const key = MACHINES[nextIdx].key
    setSlideDir(dir)
    setCategoryFilter(key)
    setModalAnime(null)
    setDispensed(null)
    setGrabbedAnime(null)
    setMachineState('idle')
    pendingNext.current = null
    replenishedRef.current = false
    setIsShaking(false)
    loadAnimes(key, true)
  }, [categoryFilter, loadAnimes])

  const refreshHistory = useCallback(async () => {
    try {
      const items = await fetchHistory()
      setHistory(items)
    } catch {
      setHistory([])
    }
  }, [])

  const openHistory = useCallback(async () => {
    setHistoryOpen(true)
    await refreshHistory()
  }, [refreshHistory])

  const closeHistory = useCallback(() => setHistoryOpen(false), [])

  const [dispensed, setDispensed] = useState<AnimeEntry | null>(null)
  const [grabbedAnime, setGrabbedAnime] = useState<AnimeEntry | null>(null)
  const [machineState, setMachineState] = useState<MachineState>('idle')
  const [modalAnime, setModalAnime] = useState<AnimeEntry | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [history, setHistory] = useState<AnimeEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  // Animation controllers
  const clawXControls = useAnimation()
  const clawYControls = useAnimation()
  const clawProngsControls = useAnimation()
  const grabbedCapsuleControls = useAnimation()

  const isAnimating = useRef(false)
  const sessionStarted = useRef(false)
  const pendingNext = useRef<AnimeEntry | null>(null)
  const modalRef = useRef<AnimeEntry | null>(null)
  const replenishedRef = useRef(false)
  const chuteX = 40 // X position of the drop chute
  const currentClawX = useRef(chuteX)
  const moveInterval = useRef<number | null>(null)

  // Mantener modalRef sincronizado con modalAnime (para saber si la modal sigue abierta)
  useEffect(() => {
    modalRef.current = modalAnime
  }, [modalAnime])

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
      sessionStarted.current = true
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
    const opened = dispensed
    if (!opened) return

    // Abrir la modal INMEDIATAMENTE (sin bloquear por el backend)
    setModalAnime(opened)
    setDispensed(null)
    replenishedRef.current = false
    if (remaining.length === 0) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }

    // Registrar consumo en el backend en segundo plano (no bloquea la UI)
    const captureId = opened.id
    const currentRemaining = remaining
    ;(async () => {
      try {
        const res = await fetch(`${CONSUME_URL}/${captureId}/consume`, { method: 'PATCH' })
        if (res.ok) {
          const body = await res.json()
          pendingNext.current = body.next || null
          // Si la modal ya se cerró durante el fetch, reponer aquí (con guarda anti-duplicados)
          if (!modalRef.current && pendingNext.current && !replenishedRef.current) {
            const next = pendingNext.current
            const newRemaining = [...currentRemaining, next]
            setRemaining(newRemaining)
            setPositions(generateCapsulePositions(newRemaining.length))
            pendingNext.current = null
            replenishedRef.current = true
            setMachineState('idle')
          }
        }
      } catch {
        pendingNext.current = null
      }
    })()
  }, [dispensed, remaining])

  const handleCloseModal = useCallback(() => {
    setModalAnime(null)

    // Al cerrar, añadir la cápsula pendiente (con animación de caída)
    const hadNext = pendingNext.current !== null
    if (pendingNext.current && !replenishedRef.current) {
      const next = pendingNext.current
      const newRemaining = [...remaining, next]
      setRemaining(newRemaining)
      setPositions(generateCapsulePositions(newRemaining.length))
      pendingNext.current = null
      replenishedRef.current = true
    }

    if (remaining.length === 0 && !hadNext) {
      setMachineState('empty')
    } else {
      setMachineState('idle')
    }
  }, [remaining])

  const handleAdminReset = useCallback(async () => {
    if (!window.confirm('¿Resetear todas las cápsulas a PENDING? La máquina se rellenará con 30 premios.')) return
    setResetting(true)
    try {
      const res = await fetch(RESET_URL, {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_SECRET_KEY },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setModalAnime(null)
      setDispensed(null)
      pendingNext.current = null
      replenishedRef.current = false
      await loadAnimes(categoryFilter, true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al resetear')
    } finally {
      setResetting(false)
    }
  }, [loadAnimes, categoryFilter])

  const activeMachine = MACHINES.find((m) => m.key === categoryFilter) || MACHINES[0]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px 40px',
      // Tema cromático según máquina activa
      ['--c-machine-main' as any]: activeMachine.main,
      ['--c-machine-dark' as any]: activeMachine.dark,
      ['--c-machine-light' as any]: activeMachine.light,
      ['--c-machine-accent' as any]: activeMachine.accent,
    }}>

      {/* History toggle (discreto, fijo arriba-derecha) */}
      <button
        onClick={openHistory}
        title="Historial de títulos"
        aria-label="Abrir historial"
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 120,
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'var(--c-machine-dark)',
          border: '2px solid var(--c-machine-light)',
          color: 'var(--c-text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        🕘
      </button>

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
        <button
          onClick={handleAdminReset}
          disabled={resetting}
          title="Resetear máquina (admin)"
          style={{
            marginTop: 12,
            background: 'var(--c-machine-dark)',
            color: 'var(--c-text-light)',
            border: '2px solid var(--c-machine-light)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: resetting ? 'default' : 'pointer',
            opacity: resetting ? 0.6 : 1,
          }}
        >
          {resetting ? 'Reseteando…' : '↻ Resetear máquina'}
        </button>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div style={{ textAlign: 'center', marginBottom: 20, fontWeight: 700, color: 'var(--c-text-light)' }}>
          Cargando premios…
        </div>
      )}
      {!loading && loadError && (
        <div style={{
          textAlign: 'center', marginBottom: 20, fontWeight: 700,
          color: '#f87171', maxWidth: 340, fontSize: 13, lineHeight: 1.5,
        }}>
          {`No se pudo conectar al backend (${loadError}). Mostrando datos de demostración.`}
        </div>
      )}

      {/* Machine + side navigation */}
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
            boxShadow: '0 4px 0 var(--c-machine-main), inset 0 2px 0 rgba(255,255,255,0.3)',
            padding: 0,
          }}
        >
          ◀
        </motion.button>

        {/* Main Machine */}
        <AnimatePresence mode="wait">
        <motion.div
          key={categoryFilter}
          initial={{ opacity: 0, x: slideDir === 'right' ? 90 : -90 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDir === 'right' ? -90 : 90 }}
          transition={{ duration: 0.32, ease: 'easeInOut' }}
          style={{ width: '100%', maxWidth: 340, display: 'flex', justifyContent: 'center' }}
        >
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
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              color: 'var(--c-text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{activeMachine.emoji}</span>
              {activeMachine.label.toUpperCase()}
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
                {categoryFilter === 'mix' && anime.category && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#0f0a18',
                      border: '1px solid rgba(255,255,255,0.5)',
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
            boxShadow: '0 4px 0 var(--c-machine-main), inset 0 2px 0 rgba(255,255,255,0.3)',
            padding: 0,
          }}
        >
          ▶
        </motion.button>
      </div>

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

      {/* History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeHistory}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
              }}
            />
            {/* Panel lateral */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(340px, 85vw)',
                zIndex: 210,
                background: 'var(--c-machine-dark)',
                borderLeft: '3px solid var(--c-machine-light)',
                boxShadow: '-8px 0 30px rgba(0,0,0,0.45)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderBottom: '2px solid var(--c-machine-light)',
              }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: 'var(--c-text-main)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  🕘 Historial
                </span>
                <button
                  onClick={closeHistory}
                  aria-label="Cerrar historial"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--c-text-light)',
                    fontSize: 18,
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Lista */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {history.length === 0 ? (
                  <p style={{
                    color: 'var(--c-text-light)',
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 30,
                    opacity: 0.8,
                  }}>
                    Aún no hay títulos en el historial.
                  </p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      padding: 8,
                    }}>
                      <img
                        src={item.image}
                        alt=""
                        style={{
                          width: 42,
                          height: 58,
                          borderRadius: 6,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          color: 'var(--c-text-main)',
                          fontWeight: 800,
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          color: 'var(--c-text-light)',
                          fontSize: 11,
                          marginTop: 2,
                        }}>
                          {item.consumedAt ? new Date(item.consumedAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 16 }}>{categoryEmoji(item.category)}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
