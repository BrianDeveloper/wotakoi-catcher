import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { AnimeEntry } from '../../types'
import { STATE_COLORS, SURFACES } from '../../constants/theme'
import { MODAL_VARIANTS } from '../../constants/animations'
import { coverImage } from '../../lib/format'
import { ImageLightbox } from '../ui/ImageLightbox'
import { CoverImage } from '../ui/CoverImage'

interface CapsuleModalProps {
  anime: AnimeEntry
  onClose: () => void
}

export function CapsuleModal({ anime, onClose }: CapsuleModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const synopsisLong = anime.synopsis.length > 160

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <motion.div
        variants={MODAL_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="modal-card"
        style={{
          borderRadius: 24,
          width: '100%',
          maxWidth: 400,
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="modal-scroll-hidden"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: '1 1 auto',
            scrollbarWidth: 'none',
          } as unknown as CSSProperties}
        >
          {/* Cover image */}
          <div
            onClick={() => setIsFullscreen(true)}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 20,
              height: 220,
              position: 'relative',
              border: `4px solid ${anime.capsuleColor}`,
              cursor: 'zoom-in'
            }}
          >
            <CoverImage
              src={anime.image}
              alt={anime.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: SURFACES.coverBadgeBg,
              color: STATE_COLORS.white,
              padding: '4px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)'
            }}>
              🔍 Ver completa
            </div>
          </div>

          {/* Title & genre */}
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <div className="genre-badge" style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              {anime.genre}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.25,
            }}>
              {anime.title}
            </h2>
          </div>

          {/* Synopsis */}
          <p
            className="synopsis-scroll-hidden"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--c-text-light)',
              textAlign: 'center',
              ...(synopsisExpanded
                ? {
                    maxHeight: 160,
                    overflowY: 'auto',
                    paddingRight: 8,
                    scrollbarWidth: 'none',
                  }
                : {
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3,
                    overflow: 'hidden',
                  }),
            } as unknown as CSSProperties}
          >
            {anime.synopsis}
          </p>

          {synopsisLong && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSynopsisExpanded((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--c-accent, #f43f5e)',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '4px 8px',
                }}
              >
                {synopsisExpanded ? 'Ver menos' : 'Ver más'}
              </motion.button>
            </div>
          )}

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{
              marginTop: 24,
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              background: anime.capsuleColor,
              color: STATE_COLORS.white,
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 4px 15px ${anime.capsuleColor}88`,
            }}
          >
            <Sparkles size={18} />
            Cerrar
          </motion.button>
        </div>
      </motion.div>

      {/* Fullscreen Image Lightbox */}
      <ImageLightbox
        open={isFullscreen}
        src={coverImage(anime.image)}
        alt={anime.title}
        glowColor={anime.capsuleColor}
        onClose={() => setIsFullscreen(false)}
      />
    </motion.div>
  )
}