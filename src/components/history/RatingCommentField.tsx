import { COMMENT_MAX_LENGTH } from '../../constants/ratings'

interface RatingCommentFieldProps {
  comment: string
  onChange: (comment: string) => void
}

export function RatingCommentField({ comment, onChange }: RatingCommentFieldProps) {
  return (
    <div>
      <label htmlFor="rating-comment" style={{
        display: 'block',
        marginBottom: 4,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: 'var(--c-text-light)',
      }}>
        Comentario (opcional)
      </label>
      <textarea
        id="rating-comment"
        value={comment}
        onChange={(event) => onChange(event.target.value)}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        placeholder="¿Qué te pareció?"
        style={{
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
          resize: 'vertical',
          minHeight: 62,
        }}
      />
      <p style={{
        margin: '3px 0 0',
        textAlign: 'right',
        fontSize: 9,
        color: 'var(--c-text-light)',
        opacity: 0.75,
      }}>
        {comment.length}/{COMMENT_MAX_LENGTH}
      </p>
    </div>
  )
}
