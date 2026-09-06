import { useState } from 'react'
import type { CSSProperties } from 'react'
import { coverImage } from '../../lib/format'

interface CoverImageProps {
  src?: string | null
  alt?: string
  style?: CSSProperties
  className?: string
}

/** Imagen de portada con placeholder por defecto (imagen ausente o URL rota) */
export function CoverImage({ src, alt, style, className }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? coverImage(null) : coverImage(src)

  return (
    <img
      src={resolved}
      alt={alt || ''}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}