import { motion } from 'framer-motion'
import { MEDAL_EMOJIS } from '../../constants/ratings'
import { SHADOWS, SURFACES, STATE_COLORS } from '../../constants/theme'
import { categoryEmoji } from '../../lib/format'
import type { RankedTitle } from '../../types'
import { CoverImage } from '../ui/CoverImage'

interface RatingPodiumProps {
  rankings: RankedTitle[]
  loading: boolean
  error: string | null
}

const PODIUM_ACCENTS = ['#fbbf24', '#cbd5e1', '#f59e0b']

export function RatingPodium({ rankings, loading, error }: RatingPodiumProps) {
  const podium = rankings.slice(0, 3)

  return (
    <section style={{
      padding: '14px 14px 16px',
      borderBottom: '2px solid var(--c-machine-light)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.12) 100%)',
      boxShadow: 'inset 0 -6px 14px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: 'var(--c-text-light)',
        }}>
          🏆 Podio de la comunidad
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-text-light)', opacity: 0.8 }}>
          {rankings.length} {rankings.length === 1 ? 'obra' : 'obras'}
        </span>
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-light)', textAlign: 'center' }}>
          Cargando podio…
        </p>
      )}

      {!loading && error && (
        <p style={{ margin: 0, fontSize: 12, color: STATE_COLORS.error, textAlign: 'center' }}>
          No se pudo cargar el ranking ({error})
        </p>
      )}

      {!loading && !error && podium.length === 0 && (
        <p style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.5,
          color: 'var(--c-text-light)',
          textAlign: 'center',
          opacity: 0.85,
        }}>
          Aún no hay notas. Califica una obra vista para inaugurar el podio.
        </p>
      )}

      {!loading && !error && podium.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 7,
          alignItems: 'end',
        }}>
          {podium.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, type: 'spring', stiffness: 240, damping: 22 }}
              style={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                padding: '7px 5px 9px',
                borderRadius: 12,
                background: index === 0
                  ? 'linear-gradient(180deg, rgba(251,191,36,0.16), rgba(0,0,0,0.18))'
                  : SURFACES.cardBg,
                border: `1px solid ${PODIUM_ACCENTS[index]}aa`,
                boxShadow: index === 0
                  ? '0 5px 0 rgba(180,83,9,0.55), inset 0 2px 0 rgba(255,255,255,0.18)'
                  : '0 3px 0 rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                transform: index === 0 ? 'translateY(-3px)' : 'none',
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>{MEDAL_EMOJIS[index]}</span>
              <div style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <CoverImage
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: 54,
                    height: 76,
                    objectFit: 'cover',
                    borderRadius: 7,
                    border: `2px solid ${PODIUM_ACCENTS[index]}`,
                    boxShadow: SHADOWS.floating,
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -2,
                  fontSize: 11,
                }}>
                  {categoryEmoji(item.category)}
                </span>
              </div>
              <span
                title={item.title}
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  textAlign: 'center',
                  color: 'var(--c-text-main)',
                }}
              >
                {item.title}
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 900,
                color: PODIUM_ACCENTS[index],
                textShadow: '0 1px 0 rgba(0,0,0,0.5)',
              }}>
                ⭐ {item.averageScore.toFixed(1)}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--c-text-light)' }}>
                {item.ratingCount} {item.ratingCount === 1 ? 'voto' : 'votos'}
              </span>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  )
}
