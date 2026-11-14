import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { STATE_COLORS } from '../../constants/theme'
import { fetchMediaRatings, submitRating } from '../../lib/api'
import { getStoredRaterName, storeRaterName } from '../../lib/raterIdentity'
import type { AnimeEntry, RatingDetail, SubmitRatingResult } from '../../types'
import { RatingCommentField } from './RatingCommentField'
import { RatingFormHeader } from './RatingFormHeader'
import { RatingScoreSelector } from './RatingScoreSelector'
import { RatingReviews } from './RatingReviews'

interface RatingFormProps {
  media: AnimeEntry
  onClose: () => void
  onSaved: (result: SubmitRatingResult) => void
}

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.28)',
  color: 'var(--c-text-main)',
  border: '1px solid var(--c-machine-light)',
  borderRadius: 8,
  padding: '8px 10px',
  fontFamily: 'inherit',
  fontSize: 12,
  outline: 'none',
} as const

const labelStyle = {
  display: 'block',
  marginBottom: 4,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: 'var(--c-text-light)',
} as const

export function RatingForm({ media, onClose, onSaved }: RatingFormProps) {
  const [raterName, setRaterName] = useState(getStoredRaterName)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [detail, setDetail] = useState<RatingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMediaRatings(media.id, getStoredRaterName())
      .then((data) => {
        if (cancelled) return
        setDetail(data)
        if (data.mine) {
          setScore(data.mine.score)
          setComment(data.mine.comment || '')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [media.id])

  const loadMyRating = async () => {
    const name = raterName.trim()
    if (!name) return
    try {
      const data = await fetchMediaRatings(media.id, name)
      setDetail(data)
      if (data.mine) {
        setScore(data.mine.score)
        setComment(data.mine.comment || '')
        setNotice('Cargamos tu calificación anterior.')
      }
    } catch {
      // Si falla, el formulario sigue disponible para guardar.
    }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const name = raterName.trim()
    if (!name) {
      setError('Escribe tu usuario de Discord para registrar la calificación.')
      return
    }
    if (score === null) {
      setError('Selecciona una nota del 1 al 10.')
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      storeRaterName(name)
      const result = await submitRating({
        mediaId: media.id,
        raterName: name,
        score,
        comment,
      })
      setNotice(result.updated ? 'Calificación actualizada.' : 'Calificación guardada.')
      onSaved(result)
      try {
        const refreshed = await fetchMediaRatings(media.id, name)
        setDetail(refreshed)
      } catch {
        // La nota ya se guardó; la lista se actualizará al reabrir el formulario.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la calificación')
    } finally {
      setSaving(false)
    }
  }

  const ratings = detail?.ratings || []

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
        zIndex: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void save(event)}
        role="dialog"
        aria-modal="true"
        aria-label={`Calificar ${media.title}`}
        className="modal-card"
        style={{
          width: 'min(380px, 94vw)',
          maxHeight: '88vh',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RatingFormHeader media={media} onClose={onClose} />

        <div className="library-scroll" style={{
          overflowY: 'auto',
          padding: '12px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}>
          <div>
            <label htmlFor="rating-rater" style={labelStyle}>Tu usuario de Discord</label>
            <input
              id="rating-rater"
              value={raterName}
              onChange={(event) => setRaterName(event.target.value)}
              onBlur={() => void loadMyRating()}
              placeholder="ej. brian"
              maxLength={80}
              autoComplete="username"
              style={fieldStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: 9.5, lineHeight: 1.4, color: 'var(--c-text-light)', opacity: 0.8 }}>
              Usa el mismo usuario que en Discord para unir tus votos.
            </p>
          </div>

          <RatingScoreSelector score={score} onChange={setScore} />

          <RatingCommentField comment={comment} onChange={setComment} />

          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 11, color: STATE_COLORS.error }}>
              {error}
            </p>
          )}
          {notice && (
            <p role="status" style={{ margin: 0, fontSize: 11, color: 'var(--c-machine-accent)' }}>
              {notice}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={saving ? undefined : { scale: 1.02 }}
            whileTap={saving ? undefined : { scale: 0.97 }}
            style={{
              border: '3px solid var(--c-machine-dark)',
              borderRadius: 10,
              background: saving
                ? 'var(--c-machine-dark)'
                : 'linear-gradient(180deg, var(--c-machine-light), var(--c-machine-main))',
              color: '#fff',
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.5,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: saving
                ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
                : '0 4px 0 var(--c-machine-dark), inset 0 1px 0 rgba(255,255,255,0.35)',
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? 'Guardando…' : detail?.mine ? '✏️ Actualizar calificación' : '⭐ Guardar calificación'}
          </motion.button>

          <RatingReviews
            ratings={ratings}
            ratingCount={detail?.summary.ratingCount || 0}
            loading={loading}
            currentName={raterName}
          />
        </div>
      </motion.form>
    </motion.div>
  )
}
