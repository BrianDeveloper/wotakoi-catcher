import { AnimatePresence, motion } from 'framer-motion'
import { SURFACES } from '../../constants/theme'

interface ImageLightboxProps {
  open: boolean
  src: string
  alt: string
  glowColor: string
  onClose: () => void
}

export function ImageLightbox({ open, src, alt, glowColor, onClose }: ImageLightboxProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: SURFACES.lightboxBg,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out'
          }}
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={src}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: `0 0 30px ${glowColor}66`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}