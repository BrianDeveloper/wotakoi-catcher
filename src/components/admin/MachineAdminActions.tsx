import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useClawMachine } from '../../context/ClawMachineContext'
import { MACHINES } from '../../constants/machineThemes'
import { STATE_COLORS } from '../../constants/theme'
import type { MachineKey } from '../../types'

const buttonStyle: CSSProperties = {
  background: 'var(--c-machine-dark)',
  color: 'var(--c-text-light)',
  border: '2px solid var(--c-machine-light)',
  borderRadius: 8,
  padding: '5px 12px',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
}

const fieldStyle: CSSProperties = {
  boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--c-text-main)',
  border: '1px solid var(--c-machine-light)',
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 700,
}

const CLEAR_TARGETS: { key: MachineKey; label: string }[] = [
  { key: 'anime', label: '🍥 Anime' },
  { key: 'movie', label: '🎬 Pelis' },
  { key: 'series', label: '📺 Series' },
]

export function MachineAdminActions({ adminKey, disabled }: { adminKey: string; disabled: boolean }) {
  const { clearing, reshuffling, handleClearMachine, handleAdminReshuffle } = useClawMachine()
  const [reroll, setReroll] = useState<MachineKey>('mix')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = disabled || clearing !== null || reshuffling

  const clear = async (category: MachineKey) => {
    setNotice(null)
    setError(null)
    const result = await handleClearMachine(adminKey, category)
    if (result) {
      const scope = category === 'mix' ? 'todas las máquinas' : `la máquina ${category}`
      setNotice(`Se devolvieron ${result.cleared} título(s) a la cola al vaciar ${scope}.`)
    }
  }

  const sortear = async () => {
    setNotice(null)
    setError(null)
    const result = await handleAdminReshuffle(adminKey, reroll)
    if (result) {
      const scope = reroll === 'mix' ? 'todas las máquinas' : `la máquina ${reroll}`
      setNotice(`Sorteo de ${scope}: ${result.selected} títulos en máquinas y ${result.pending} pendientes.`)
    }
  }

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      padding: 12,
      border: '1px solid var(--c-machine-light)',
      borderRadius: 10,
      background: 'rgba(0,0,0,0.2)',
      textAlign: 'left',
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-text-light)' }}>
        🧹 Vaciar máquinas (los títulos vuelven a la cola)
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CLEAR_TARGETS.map((target) => (
          <button
            key={target.key}
            onClick={() => void clear(target.key)}
            disabled={busy}
            style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}
          >
            {clearing === target.key ? 'Vaciando…' : target.label}
          </button>
        ))}
        <button
          onClick={() => void clear('mix')}
          disabled={busy}
          title="Vaciar todas las máquinas"
          style={{
            ...buttonStyle,
            borderColor: STATE_COLORS.error,
            color: STATE_COLORS.error,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {clearing === 'mix' ? 'Vaciando…' : '🧹 Vaciar Todas'}
        </button>
      </div>

      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-text-light)', marginTop: 4 }}>
        🎲 Sortear una máquina (30 pendientes al azar)
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <select
          aria-label="Máquina a sortear"
          value={reroll}
          onChange={(event) => setReroll(event.target.value as MachineKey)}
          disabled={busy}
          style={{ ...fieldStyle, flex: 1, minWidth: 150 }}
        >
          {MACHINES.map((machine) => (
            <option key={machine.key} value={machine.key}>
              {machine.emoji} {machine.label}
            </option>
          ))}
        </select>
        <button onClick={() => void sortear()} disabled={busy} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
          {reshuffling ? 'Sorteando…' : '🎲 Sortear'}
        </button>
      </div>

      {error && (
        <span role="alert" style={{ color: STATE_COLORS.error, fontSize: 11, fontWeight: 700 }}>
          {error}
        </span>
      )}
      {notice && (
        <span role="status" style={{ color: 'var(--c-text-light)', fontSize: 11, fontWeight: 700 }}>
          {notice}
        </span>
      )}
    </section>
  )
}
