import { useState } from 'react'

interface FilterChipProps {
  emoji: string
  label: string
  active: boolean
  onClick: () => void
  ariaLabel?: string
}

/** Botón de filtro: solo emoji visible; el texto se revela al hacer hover */
export function FilterChip({ emoji, label, active, onClick, ariaLabel }: FilterChipProps) {
  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={active}
      aria-label={ariaLabel || label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: active ? 'var(--c-machine-main)' : 'transparent',
        border: `2px solid ${active ? 'var(--c-machine-light)' : 'transparent'}`,
        color: active ? 'var(--c-text-main)' : 'var(--c-text-light)',
        borderRadius: 999,
        padding: '4px 6px',
        fontSize: 13,
        lineHeight: 1,
        cursor: 'pointer',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
    >
      <span style={{ lineHeight: 1 }}>{emoji}</span>
      <span style={{
        maxWidth: hover ? 90 : 0,
        opacity: hover ? 1 : 0,
        fontSize: 12,
        fontWeight: 700,
        marginLeft: hover ? 6 : 0,
        overflow: 'hidden',
        transition: 'max-width 0.25s ease, opacity 0.25s ease, margin-left 0.25s ease',
      }}>
        {label}
      </span>
    </button>
  )
}