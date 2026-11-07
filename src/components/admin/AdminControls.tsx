import { useState } from 'react'
import { useClawMachine } from '../../context/ClawMachineContext'
import {
  getNotificationSettings,
  previewNotification,
  saveNotificationSettings,
  sendTestNotification,
  setWebhookEnabled,
} from '../../lib/api'
import type { DiscordWebhookPayload, NotificationTemplateSettings } from '../../lib/api'
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

const fieldStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--c-text-main)',
  border: '1px solid var(--c-machine-light)',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 12,
}

const DEFAULT_TEMPLATES: NotificationTemplateSettings = {
  content: '🎮 ¡La Máquina de Gancho ha hablado! La obra seleccionada para la sesión de hoy es: **{title}**.',
  embedTitle: '{title}',
  embedDescription: '{synopsis}',
  embedFooter: 'Máquina de Gancho Discord • Sesión de Selección',
  showImage: true,
}

type TemplateTextField = 'content' | 'embedTitle' | 'embedDescription' | 'embedFooter'

export function AdminControls() {
  const {
    resetting,
    reshuffling,
    handleAdminReset,
    handleAdminReshuffle,
    syncDiscord,
    syncing,
    lastSyncAdded,
    lastSyncMessagesRead,
    syncBackfillComplete,
    syncRestartedForEmptyMedia,
    lastSyncIgnored,
    lastSyncDiscarded,
    lastSyncFailures,
    lastSyncError,
  } = useClawMachine()
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('wotakoi-admin-key') || '')
  const [connected, setConnected] = useState(false)
  const [webhookEnabled, setWebhookEnabledState] = useState(true)
  const [templates, setTemplates] = useState<NotificationTemplateSettings>(DEFAULT_TEMPLATES)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [preview, setPreview] = useState<DiscordWebhookPayload | null>(null)

  const disabled = resetting || reshuffling || syncing || busy

  const connectAdmin = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const data = await getNotificationSettings(adminKey)
      sessionStorage.setItem('wotakoi-admin-key', adminKey)
      setTemplates(data.settings)
      setWebhookEnabledState(data.enabled)
      setConnected(true)
      setNotice('Acceso administrativo confirmado.')
    } catch (err) {
      sessionStorage.removeItem('wotakoi-admin-key')
      setConnected(false)
      setError(err instanceof Error ? err.message : 'No se pudo validar la clave')
    } finally {
      setBusy(false)
    }
  }

  const toggleWebhook = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const enabled = await setWebhookEnabled(adminKey, !webhookEnabled)
      setWebhookEnabledState(enabled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar notificaciones')
    } finally {
      setBusy(false)
    }
  }

  const updateTemplate = (field: TemplateTextField, value: string) => {
    setTemplates((current) => ({ ...current, [field]: value }))
    setPreview(null)
  }

  const saveTemplates = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await saveNotificationSettings(adminKey, templates)
      setTemplates(saved)
      setNotice('Plantilla guardada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla')
    } finally {
      setBusy(false)
    }
  }

  const loadPreview = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setPreview(await previewNotification(adminKey, templates))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la vista previa')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await sendTestNotification(adminKey, templates)
      setNotice('Notificación de prueba enviada a Discord.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la prueba')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      width: 'min(100%, 520px)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%' }}>
        <input
          aria-label="Clave de administrador"
          type="password"
          autoComplete="current-password"
          placeholder="Clave de administrador"
          value={adminKey}
          onChange={(event) => {
            setAdminKey(event.target.value)
            setConnected(false)
            setError(null)
          }}
          style={{ ...fieldStyle, width: 220 }}
        />
        <button
          onClick={connectAdmin}
          disabled={busy || !adminKey}
          style={{ ...buttonStyle, opacity: busy || !adminKey ? 0.6 : 1 }}
        >
          {busy && !connected ? 'Validando…' : connected ? 'Admin conectado' : 'Conectar admin'}
        </button>
      </div>

      {connected && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => handleAdminReset(adminKey)}
              disabled={disabled}
              title="Resetear máquina"
              style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}
            >
              {resetting ? 'Reseteando…' : '↻ Resetear máquina'}
            </button>
            <button
              onClick={async () => {
                const result = await handleAdminReshuffle(adminKey)
                if (result) {
                  setNotice(`Sorteo actualizado: ${result.selected} títulos en máquinas y ${result.pending} pendientes. Los consumidos se conservaron.`)
                  setError(null)
                }
              }}
              disabled={disabled}
              title="Volver a sortear las obras activas entre las máquinas"
              style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}
            >
              {reshuffling ? 'Sorteando…' : '🎲 Sortear máquinas'}
            </button>
            <button
              onClick={() => syncDiscord(adminKey)}
              disabled={disabled}
              title="Importar títulos del canal de sugerencias"
              style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}
            >
              {syncing ? 'Sincronizando…' : '🔁 Sincronizar'}
            </button>
            <button
              onClick={toggleWebhook}
              disabled={disabled}
              title="Activar o desactivar las notificaciones"
              style={{
                ...buttonStyle,
                borderColor: webhookEnabled ? 'var(--c-machine-light)' : STATE_COLORS.error,
                color: webhookEnabled ? 'var(--c-text-main)' : STATE_COLORS.error,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {webhookEnabled ? '🔔 Avisos ON' : '🔕 Avisos OFF'}
            </button>
          </div>

          <button
            onClick={() => setTemplatesOpen((open) => !open)}
            style={buttonStyle}
            aria-expanded={templatesOpen}
          >
            {templatesOpen ? 'Cerrar formato de notificaciones' : '✏️ Editar notificaciones'}
          </button>

          {templatesOpen && (
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
              <span style={{ fontSize: 11, color: 'var(--c-text-light)' }}>
                Variables: {'{title}'}, {'{category}'}, {'{suggested_by}'}, {'{synopsis}'}. No se permiten menciones de Discord.
              </span>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Texto del mensaje
                <textarea
                  value={templates.content}
                  onChange={(event) => updateTemplate('content', event.target.value)}
                  rows={3}
                  maxLength={2000}
                  style={{ ...fieldStyle, resize: 'vertical', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Título del embed
                <input
                  value={templates.embedTitle}
                  onChange={(event) => updateTemplate('embedTitle', event.target.value)}
                  maxLength={256}
                  style={{ ...fieldStyle, marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Descripción del embed
                <textarea
                  value={templates.embedDescription}
                  onChange={(event) => updateTemplate('embedDescription', event.target.value)}
                  rows={4}
                  maxLength={4096}
                  style={{ ...fieldStyle, resize: 'vertical', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Pie del embed
                <input
                  value={templates.embedFooter}
                  onChange={(event) => updateTemplate('embedFooter', event.target.value)}
                  maxLength={2048}
                  style={{ ...fieldStyle, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={templates.showImage}
                  onChange={(event) => {
                    setTemplates((current) => ({ ...current, showImage: event.target.checked }))
                    setPreview(null)
                  }}
                />
                Incluir imagen del título
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button onClick={saveTemplates} disabled={disabled} style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}>
                  Guardar
                </button>
                <button onClick={loadPreview} disabled={disabled} style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}>
                  Vista previa
                </button>
                <button onClick={sendTest} disabled={disabled} style={{ ...buttonStyle, opacity: disabled ? 0.6 : 1 }}>
                  Enviar prueba
                </button>
              </div>
              {preview && (
                <div style={{ padding: 10, borderRadius: 6, background: '#202225', color: '#f2f3f5', fontSize: 12 }}>
                  {preview.content && <p style={{ whiteSpace: 'pre-wrap' }}>{preview.content}</p>}
                  {preview.embeds?.[0] && (
                    <div style={{ borderLeft: '4px solid #22d3ee', padding: '4px 10px' }}>
                      <strong>{preview.embeds[0].title || ''}</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{preview.embeds[0].description || ''}</p>
                      {preview.embeds[0].footer?.text
                        ? <small>{preview.embeds[0].footer.text}</small>
                        : null}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {error && (
        <span role="alert" style={{ color: STATE_COLORS.error, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
          {error}
        </span>
      )}
      {notice && (
        <span role="status" style={{ color: 'var(--c-text-light)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
          {notice}
        </span>
      )}
      {lastSyncError && (
        <span role="alert" style={{ color: STATE_COLORS.error, fontSize: 11, fontWeight: 700, maxWidth: 340, textAlign: 'center' }}>
          Error al sincronizar: {lastSyncError}
        </span>
      )}
      {lastSyncAdded !== null && !lastSyncError && (
        <span style={{ color: 'var(--c-text-light)', fontSize: 11, fontWeight: 700 }}>
          {syncRestartedForEmptyMedia && 'La tabla estaba vacía: se reinició el cursor.'}
          {`✓ ${lastSyncAdded > 0
            ? `${lastSyncAdded} ${lastSyncAdded === 1 ? 'obra nueva' : 'obras nuevas'}`
            : 'Sin novedades'} agregadas desde Discord; ${lastSyncMessagesRead} mensajes leídos.`}
          {!syncBackfillComplete && ' Hay más historial; pulsa Sincronizar de nuevo para continuar.'}
          {syncBackfillComplete && ' Se alcanzó el inicio del historial disponible.'}
        </span>
      )}
      {lastSyncDiscarded.length > 0 && (
        <details style={{ maxWidth: 480, color: 'var(--c-text-light)', fontSize: 11, textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
            {lastSyncDiscarded.length} título(s) descartados — ver motivos
          </summary>
          <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
            {lastSyncDiscarded.map((item, index) => (
              <li key={`${item.title}-${index}`} style={{ marginBottom: 6 }}>
                <strong>{item.title}</strong>: {item.reason}
                {item.bestMatch && (
                  <> Mejor resultado: “{item.bestMatch}” (coincidencia {item.score.toFixed(2)}; mínimo {item.threshold.toFixed(2)}).</>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      {lastSyncIgnored.length > 0 && (
        <details style={{ maxWidth: 480, color: 'var(--c-text-light)', fontSize: 11, textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
            {lastSyncIgnored.length} línea(s) omitidas antes de consultar TMDB
          </summary>
          <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
            {lastSyncIgnored.map((item, index) => (
              <li key={`${item.text}-${index}`} style={{ marginBottom: 6 }}>
                <strong>{item.text}</strong>: {item.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {lastSyncFailures.length > 0 && (
        <details role="alert" style={{ maxWidth: 480, color: STATE_COLORS.error, fontSize: 11, textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
            {lastSyncFailures.length} título(s) no pudieron consultarse; se reintentará
          </summary>
          <ul style={{ margin: '6px 0', paddingLeft: 20 }}>
            {lastSyncFailures.map((failure, index) => (
              <li key={`${failure.title}-${index}`} style={{ marginBottom: 6 }}>
                <strong>{failure.title}</strong>: {failure.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
