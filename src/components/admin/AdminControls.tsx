import { useClawMachine } from '../../context/ClawMachineContext'
import { useWebhookToggle } from '../../hooks/useWebhookToggle'
import { STATE_COLORS } from '../../constants/theme'
import type { CSSProperties } from 'react'

const buttonStyle: CSSProperties = {
  background: 'var(--c-machine-dark)',
  color: 'var(--c-text-light)',
  border: '2px solid var(--c-machine-light)',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

export function AdminControls() {
  const {
    resetting,
    handleAdminReset,
    syncDiscord,
    syncing,
    lastSyncAdded,
    lastSyncError,
  } = useClawMachine()
  const { enabled: webhookEnabled, loaded: webhookLoaded, error: webhookError, toggle: toggleWebhook } =
    useWebhookToggle()

  const disabled = resetting || syncing || !webhookLoaded

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleAdminReset}
          disabled={disabled}
          title="Resetear máquina (admin)"
          style={{ ...buttonStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
          {resetting ? 'Reseteando…' : '↻ Resetear máquina'}
        </button>

        <button
          onClick={() => syncDiscord()}
          disabled={disabled}
          title="Buscar títulos nuevos en el canal de sugerencias"
          style={{ ...buttonStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
          {syncing ? 'Sincronizando…' : '🔁 Sincronizar'}
        </button>

        <button
          onClick={() => toggleWebhook()}
          disabled={disabled}
          title="Activar/desactivar aviso en el canal de anuncios al sacar un premio"
          style={{
            ...buttonStyle,
            borderColor: webhookEnabled ? 'var(--c-machine-light)' : STATE_COLORS.error,
            color: webhookEnabled ? 'var(--c-text-main)' : STATE_COLORS.error,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {webhookLoaded ? (webhookEnabled ? '🔔 Avisos ON' : '🔕 Avisos OFF') : '…'}
        </button>
      </div>

      {webhookError && (
        <span style={{ color: STATE_COLORS.error, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
          Error al cambiar notificaciones: {webhookError}
        </span>
      )}

      {lastSyncError && (
        <span style={{ color: STATE_COLORS.error, fontSize: 11, fontWeight: 700, maxWidth: 340, textAlign: 'center' }}>
          Error al sincronizar: {lastSyncError}
        </span>
      )}

      {lastSyncAdded !== null && !lastSyncError && (
        <span style={{ color: 'var(--c-text-light)', fontSize: 11, fontWeight: 700 }}>
          {lastSyncAdded > 0
            ? `✓ ${lastSyncAdded} ${lastSyncAdded === 1 ? 'obra nueva' : 'obras nuevas'} desde Discord`
            : '✓ Sin novedades desde Discord'}
        </span>
      )}
    </div>
  )
}