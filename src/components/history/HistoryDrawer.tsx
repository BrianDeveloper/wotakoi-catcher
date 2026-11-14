import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { useHistoryRatings } from '../../hooks/useHistoryRatings'
import { SHADOWS } from '../../constants/theme'
import type { AnimeEntry } from '../../types'
import { RatingPodium } from './RatingPodium'
import { HistoryCard } from './HistoryCard'
import { RatingForm } from './RatingForm'

export function HistoryDrawer() {
  const { history, historyOpen, closeHistory, refreshHistory } = useClawMachine()
  const {
    rankings,
    loading: rankingsLoading,
    error: rankingsError,
    refresh: refreshRankings,
  } = useHistoryRatings(historyOpen)
  const [ratingTarget, setRatingTarget] = useState<AnimeEntry | null>(null)

  const handleClose = () => {
    setRatingTarget(null)
    closeHistory()
  }

  const handleSaved = async () => {
    await Promise.all([refreshHistory(), refreshRankings()])
  }

  return (
    <AnimatePresence>
      {historyOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(372px, 94vw)',
              zIndex: 210,
              background: 'linear-gradient(180deg, var(--c-machine-dark) 0%, #160a26 100%)',
              borderLeft: '3px solid var(--c-machine-light)',
              boxShadow: SHADOWS.drawer,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <header style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '2px solid var(--c-machine-light)',
              background: 'rgba(0,0,0,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>
              <div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: 'var(--c-text-main)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  🕘 Historial
                </div>
                <div style={{ marginTop: 2, fontSize: 9.5, fontWeight: 800, color: 'var(--c-text-light)', letterSpacing: 0.6 }}>
                  Sala de cine · {history.length} {history.length === 1 ? 'obra vista' : 'obras vistas'}
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Cerrar historial"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  color: 'var(--c-text-light)',
                  width: 30,
                  height: 30,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </header>

            <RatingPodium
              rankings={rankings}
              loading={rankingsLoading}
              error={rankingsError}
            />

            <div className="library-scroll" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2px 2px',
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--c-text-light)',
                }}>
                  Vistos recientemente
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--c-text-light)', opacity: 0.7 }}>
                  Toca ⭐ para calificar
                </span>
              </div>

              {history.length === 0 ? (
                <div style={{
                  marginTop: 12,
                  padding: '18px 14px',
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.16)',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--c-text-light)', opacity: 0.85 }}>
                    Aún no hay títulos en el historial.
                  </p>
                  <p style={{ margin: '5px 0 0', fontSize: 10.5, color: 'var(--c-text-light)', opacity: 0.65 }}>
                    Cuando saques una obra de la máquina aparecerá aquí.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onRate={() => setRatingTarget(item)}
                  />
                ))
              )}
            </div>
          </motion.aside>

          <AnimatePresence>
            {ratingTarget && (
              <RatingForm
                key={ratingTarget.id}
                media={ratingTarget}
                onClose={() => setRatingTarget(null)}
                onSaved={() => void handleSaved()}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
