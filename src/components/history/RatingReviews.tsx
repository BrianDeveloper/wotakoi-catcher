import { SURFACES } from '../../constants/theme'
import type { MediaRating } from '../../types'

interface RatingReviewsProps {
  ratings: MediaRating[]
  ratingCount: number
  loading: boolean
  currentName: string
}

export function RatingReviews({ ratings, ratingCount, loading, currentName }: RatingReviewsProps) {
  const normalizedName = currentName.trim().toLowerCase()

  return (
    <div style={{
      borderTop: `1px solid ${SURFACES.cardBorder}`,
      paddingTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <span style={{
        display: 'block',
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: 'var(--c-text-light)',
      }}>
        Reseñas ({ratingCount})
      </span>
      {loading && (
        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--c-text-light)' }}>
          Cargando reseñas…
        </p>
      )}
      {!loading && ratings.length === 0 && (
        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--c-text-light)', opacity: 0.8 }}>
          Aún no hay reseñas. Sé la primera persona en calificar.
        </p>
      )}
      {ratings.map((rating) => {
        const mine = rating.raterName.trim().toLowerCase() === normalizedName
        return (
          <div key={rating.id} style={{
            borderRadius: 8,
            padding: '6px 8px',
            background: mine ? 'rgba(45,212,191,0.08)' : 'rgba(0,0,0,0.18)',
            border: `1px solid ${mine ? 'var(--c-machine-accent)' : SURFACES.cardBorder}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                minWidth: 0,
                flex: 1,
                fontSize: 10.5,
                fontWeight: 900,
                color: 'var(--c-text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {rating.source === 'discord' ? '🎮' : '💻'} {rating.raterName}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#fbbf24',
                whiteSpace: 'nowrap',
              }}>
                ⭐ {rating.score}/10
              </span>
            </div>
            {rating.comment && (
              <p style={{
                margin: '3px 0 0',
                fontSize: 10.5,
                lineHeight: 1.4,
                color: 'var(--c-text-light)',
                overflowWrap: 'anywhere',
              }}>
                {rating.comment}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
