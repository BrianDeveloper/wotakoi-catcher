import type { CapsuleBallProps } from '../../types'
import { SHADOWS } from '../../constants/theme'
import { SURFACES } from '../../constants/theme'

export function CapsuleBall({ color, size = 36, style }: CapsuleBallProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: SHADOWS.capsuleDrop,
        border: `1px solid ${SURFACES.capsuleBorder}`,
        ...style,
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: color,
        borderTop: `2px solid ${SURFACES.capsuleBottomEdge}`,
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: SURFACES.capsuleGlass,
        backdropFilter: 'blur(2px)',
      }} />

      {/* Sombreado radial interno para sugerir curvatura de esfera */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 32% 28%, transparent 0%, rgba(0,0,0,0.28) 70%, rgba(0,0,0,0.5) 100%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Brillo especular superior (plástico) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '18%',
        width: '34%',
        height: '28%',
        background: SURFACES.capsuleHighlight,
        borderRadius: '50%',
        filter: 'blur(1.5px)',
        transform: 'rotate(-45deg)',
        boxShadow: '0 0 6px rgba(255,255,255,0.8)',
      }} />

      {/* Glint inferior (reflejo del suelo del gabinete) */}
      <div style={{
        position: 'absolute',
        bottom: '12%',
        right: '16%',
        width: '22%',
        height: '14%',
        background: 'rgba(255,255,255,0.28)',
        borderRadius: '50%',
        filter: 'blur(2px)',
        transform: 'rotate(35deg)',
      }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        background: SURFACES.capsuleSeam,
        transform: 'translateY(-50%)',
      }} />
    </div>
  )
}