import { useCallback, useEffect, useState } from 'react'
import { getWebhookStatus, setWebhookEnabled } from '../lib/api'

/** Estado del envío de notificaciones al canal de anuncios (toggle admin) */
export function useWebhookToggle() {
  const [enabled, setEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getWebhookStatus()
      .then((value) => {
        if (active) setEnabled(value)
      })
      .catch(() => {
        if (active) setEnabled(true)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const toggle = useCallback(async () => {
    setError(null)
    try {
      const next = await setWebhookEnabled(!enabled)
      setEnabled(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar notificaciones')
    }
  }, [enabled])

  return { enabled, loaded, error, toggle }
}