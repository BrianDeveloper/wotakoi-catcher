import { motion } from 'framer-motion'
import { SURFACES } from '../../constants/theme'
import { categoryEmoji } from '../../lib/format'
import type { AnimeEntry } from '../../types'
import { CoverImage } from '../ui/CoverImage'

interface HistoryCardProps {
  item: AnimeEntry
  onRate: () => void
}

export function HistoryCard({ item, onRate }: HistoryCardProps) {
  const ratingCount = item.ratingCount || 0
  const average = item.averageScore || 0

  return (
    <article style={{
      display: 'flex',
      gap: 9,
      alignItems: 'stretch',
      background: SURFACES.cardBg,
      border: `1px solid ${SURFACES.cardBorder}`,
      borderRadius: 11,
      padding: 8,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 8px rgba(0,0,0,0.18)',
    }}>
      <CoverImage
        src={item.image}
        alt={item.title}
        style={{
          width: 44,
          height: 62,
          borderRadius: 6,
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      />

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 12 }}>{categoryEmoji(item.category)}</span>
          <span
            title={item.title}
            style={{
              minWidth: 0,
              flex: 1,
              color: 'var(--c-text-main)',
              fontWeight: 800,
              fontSize: 12.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
          flexWrap: 'wrap',
        }}>
          {ratingCount > 0 ? (
            <span style={{
              fontSize: 10,
              fontWeight: 900,
              color: '#fbbf24',
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.45)',
              borderRadius: 999,
              padding: '1px 7px',
              whiteSpace: 'nowrap',
            }}>
              ⭐ {average.toFixed(1)} · {ratingCount} {ratingCount === 1 ? 'voto' : 'votos'}
            </span>
          ) : (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--c-text-light)',
              background: 'rgba(255,255,255,0.05)',
              border: `1px dashed ${SURFACES.cardBorder}`,
              borderRadius: 999,
              padding: '1px 7px',
              whiteSpace: 'nowrap',
            }}>
              Sin calificar
            </span>
          )}
        </div>

        <div style={{
          marginTop: 'auto',
          paddingTop: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}>
          <span style={{
            minWidth: 0,
            color: 'var(--c-text-light)',
            fontSize: 9.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString() : ''}
          </span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRate}
            aria-label={`Calificar ${item.title}`}
            style={{
              flexShrink: 0,
              border: '2px solid var(--c-machine-light)',
              borderRadius: 7,
              background: 'var(--c-machine-main)',
              color: 'var(--c-text-main)',
              cursor: 'pointer',
              padding: '3px 8px',
              fontFamily: 'inherit',
              fontSize: 10,
              fontWeight: 900,
              boxShadow: '0 2px 0 var(--c-machine-dark), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            ⭐ Calificar
          </motion.button>
        </div>
      </div>
    </article>
  )
}
