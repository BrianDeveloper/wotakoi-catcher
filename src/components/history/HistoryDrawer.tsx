import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { categoryEmoji } from '../../lib/format'
import { SHADOWS, SURFACES } from '../../constants/theme'
import { CoverImage } from '../ui/CoverImage'

export function HistoryDrawer() {
  const { history, historyOpen, closeHistory } = useClawMachine()

  return (
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
              boxShadow: SHADOWS.drawer,
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
                    background: SURFACES.cardBg,
                    border: `1px solid ${SURFACES.cardBorder}`,
                    borderRadius: 10,
                    padding: 8,
                  }}>
                    <CoverImage
                      src={item.image}
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
  )
}