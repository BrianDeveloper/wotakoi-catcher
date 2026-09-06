import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { categoryEmoji } from '../../lib/format'
import { SHADOWS, SURFACES, STATE_COLORS } from '../../constants/theme'
import { LIBRARY_FILTERS, STATUS_FILTERS, statusMeta } from '../../constants/titles'
import type { StatusFilter } from '../../constants/titles'
import { CoverImage } from '../ui/CoverImage'
import { FilterChip } from '../ui/FilterChip'

const inputStyle = {
  width: '100%',
  background: 'var(--c-bg)',
  color: 'var(--c-text-main)',
  border: '2px solid var(--c-machine-light)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 700,
  outline: 'none',
}

export function TitlesDrawer() {
  const {
    titles,
    libraryOpen,
    libraryFilter,
    libraryLoading,
    libraryError,
    closeLibrary,
    selectLibraryCategory,
  } = useClawMachine()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return titles.filter((item) =>
      (!q || item.title.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || item.status === statusFilter)
    )
  }, [titles, query, statusFilter])

  return (
    <AnimatePresence>
      {libraryOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLibrary}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          />
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
              width: 'min(360px, 90vw)',
              zIndex: 210,
              background: 'var(--c-machine-dark)',
              borderLeft: '3px solid var(--c-machine-light)',
              boxShadow: SHADOWS.drawer,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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
                📚 Biblioteca <span style={{ fontSize: 11, opacity: 0.8 }}>({visible.length})</span>
              </span>
              <button
                onClick={closeLibrary}
                aria-label="Cerrar biblioteca"
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

            {/* Búsqueda */}
            <div style={{ padding: '10px 14px', borderBottom: '2px solid var(--c-machine-light)' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Buscar título…"
                aria-label="Buscar título"
                style={inputStyle}
              />
            </div>

            {/* Filtros de categoría */}
            <div style={{
              display: 'flex',
              gap: 6,
              padding: '10px 14px',
              borderBottom: '2px solid var(--c-machine-light)',
              flexWrap: 'wrap',
            }}>
              {LIBRARY_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  emoji={f.emoji}
                  label={f.label}
                  active={libraryFilter === f.key}
                  onClick={() => selectLibraryCategory(f.key)}
                  ariaLabel={f.label}
                />
              ))}
            </div>

            {/* Filtros de estado */}
            <div style={{
              display: 'flex',
              gap: 6,
              padding: '10px 14px',
              borderBottom: '2px solid var(--c-machine-light)',
              flexWrap: 'wrap',
            }}>
              {STATUS_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  emoji={f.emoji}
                  label={f.label}
                  active={statusFilter === f.key}
                  onClick={() => setStatusFilter(f.key)}
                  ariaLabel={f.label}
                />
              ))}
            </div>

            {/* Lista */}
            <div className="library-scroll" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {libraryLoading && (
                <p style={{ color: 'var(--c-text-light)', fontSize: 13, textAlign: 'center', marginTop: 30 }}>
                  Cargando títulos…
                </p>
              )}

              {!libraryLoading && libraryError && (
                <p style={{ color: STATE_COLORS.error, fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 1.5 }}>
                  No se pudo cargar la biblioteca ({libraryError})
                </p>
              )}

              {!libraryLoading && !libraryError && titles.length === 0 && (
                <p style={{ color: 'var(--c-text-light)', fontSize: 13, textAlign: 'center', marginTop: 30, opacity: 0.8 }}>
                  Aún no hay títulos en la biblioteca.
                </p>
              )}

              {!libraryLoading && !libraryError && titles.length > 0 && visible.length === 0 && (
                <p style={{ color: 'var(--c-text-light)', fontSize: 13, textAlign: 'center', marginTop: 30, opacity: 0.8 }}>
                  Sin coincidencias con la búsqueda o filtros.
                </p>
              )}

              {visible.map((item) => {
                const meta = statusMeta(item.status)
                return (
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
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.suggested_by ? `👤 ${item.suggested_by}` : '👤 —'}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 13 }}>{categoryEmoji(item.category)}</span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: `${meta.color}2e`,
                          color: meta.color,
                          border: `1px solid ${meta.color}66`,
                          borderRadius: 999,
                          padding: '1px 8px',
                          whiteSpace: 'nowrap',
                        }}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}