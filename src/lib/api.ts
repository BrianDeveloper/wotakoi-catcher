import { MACHINE_QUERY_PARAM } from '../constants/machineThemes'
import type { AnimeEntry, MachineKey } from '../types'

const MACHINE_URL = 'http://localhost:4000/api/machine/capsules'
const CONSUME_URL = 'http://localhost:4000/api/capsules'
const RESET_URL = 'http://localhost:4000/api/admin/reset'
const HISTORY_URL = 'http://localhost:4000/api/history'
const TITLES_URL = 'http://localhost:4000/api/titles'
const SYNC_URL = 'http://localhost:4000/api/sync-discord'
const WEBHOOK_STATUS_URL = 'http://localhost:4000/api/admin/webhook/status'
const WEBHOOK_TOGGLE_URL = 'http://localhost:4000/api/admin/webhook/toggle'
const ADMIN_SECRET_KEY = '65f4d8c6989f4c02b6b44da2e438f506'

export async function fetchAnimes(category: MachineKey): Promise<{ capsules: AnimeEntry[]; category: string }> {
  const url = `${MACHINE_URL}?category=${MACHINE_QUERY_PARAM[category]}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchHistory(): Promise<AnimeEntry[]> {
  const res = await fetch(HISTORY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.history || []
}

export async function fetchTitles(category?: MachineKey | null): Promise<AnimeEntry[]> {
  const url = category && category !== 'mix'
    ? `${TITLES_URL}?category=${category}`
    : TITLES_URL
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.titles || []
}

export async function consumeCapsule(id: string): Promise<{ next: AnimeEntry | null }> {
  const res = await fetch(`${CONSUME_URL}/${id}/consume`, { method: 'PATCH' })
  if (res.ok) {
    const body = await res.json()
    return { next: body.next || null }
  }
  return { next: null }
}

export async function resetMachine(): Promise<void> {
  const res = await fetch(RESET_URL, {
    method: 'POST',
    headers: { 'x-admin-key': ADMIN_SECRET_KEY },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export async function syncSuggestions(): Promise<{ added: number }> {
  const res = await fetch(SYNC_URL, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  const body = await res.json()
  return { added: body.added ?? 0 }
}

export async function getWebhookStatus(): Promise<boolean> {
  const res = await fetch(WEBHOOK_STATUS_URL, {
    headers: { 'x-admin-key': ADMIN_SECRET_KEY },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  const body = await res.json()
  return body.enabled === true
}

export async function setWebhookEnabled(enabled: boolean): Promise<boolean> {
  const res = await fetch(WEBHOOK_TOGGLE_URL, {
    method: 'POST',
    headers: { 'x-admin-key': ADMIN_SECRET_KEY },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  const body = await res.json()
  return body.enabled === true
}