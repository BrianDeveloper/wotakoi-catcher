import { categoryEmoji } from '../../lib/format'
import type { AnimeEntry } from '../../types'
import { CoverImage } from '../ui/CoverImage'

interface RatingFormHeaderProps {
  media: AnimeEntry
  onClose: () => void
}

export function RatingFormHeader({ media, onClose }: RatingFormHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderBottom: '2px solid var(--c-machine-light)',
      background: 'rgba(0,0,0,0.18)',
    }}>
      <CoverImage
        src={media.image}
        alt={media.title}
        style={{
          width: 36,
          height: 50,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--c-machine-accent)',
        }}>
          {categoryEmoji(media.category)} Calificar obra
        </div>
        <div style={{
          color: 'var(--c-text-main)',
          fontSize: 13,
          fontWeight: 900,
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}>
          {media.title}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar formulario de calificación"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--c-text-light)',
          fontSize: 18,
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  )
}
