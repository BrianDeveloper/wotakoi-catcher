import { motion } from 'framer-motion'
import { RATING_SCORES, ratingLabel } from '../../constants/ratings'
import { SURFACES } from '../../constants/theme'

interface RatingScoreSelectorProps {
  score: number | null
  onChange: (score: number) => void
}

export function RatingScoreSelector({ score, onChange }: RatingScoreSelectorProps) {
  return (
    <div>
      <span style={{
        display: 'block',
        marginBottom: 4,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: 'var(--c-text-light)',
      }}>
        Nota
      </span>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 5,
      }}>
        {RATING_SCORES.map((value) => {
          const active = score === value
          return (
            <motion.button
              key={value}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(value)}
              aria-pressed={active}
              aria-label={`Nota ${value} de 10`}
              style={{
                padding: '7px 0',
                borderRadius: 7,
                border: `1px solid ${active ? 'var(--c-machine-accent)' : SURFACES.cardBorder}`,
                background: active
                  ? 'linear-gradient(180deg, var(--c-machine-light), var(--c-machine-main))'
                  : 'rgba(0,0,0,0.2)',
                color: active ? '#fff' : 'var(--c-text-light)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 900,
                boxShadow: active
                  ? '0 2px 0 var(--c-machine-dark), inset 0 1px 0 rgba(255,255,255,0.35)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {value}
            </motion.button>
          )
        })}
      </div>
      <p style={{
        margin: '5px 0 0',
        fontSize: 10.5,
        fontWeight: 800,
        color: 'var(--c-machine-accent)',
        minHeight: 15,
      }}>
        {score === null ? 'Elige una nota' : `${score}/10 · ${ratingLabel(score)}`}
      </p>
    </div>
  )
}
