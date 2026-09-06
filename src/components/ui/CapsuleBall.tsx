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

      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '30%',
        height: '25%',
        background: SURFACES.capsuleHighlight,
        borderRadius: '50%',
        filter: 'blur(1px)',
        transform: 'rotate(-45deg)',
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