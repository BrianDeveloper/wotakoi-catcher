import { MACHINE_QUERY_PARAM } from '../constants/machineThemes'
import type { AnimeEntry, MachineKey } from '../types'

const MACHINE_URL = 'http://localhost:4000/api/machine/capsules'
const CONSUME_URL = 'http://localhost:4000/api/capsules'
const RESET_URL = 'http://localhost:4000/api/admin/reset'
const HISTORY_URL = 'http://localhost:4000/api/history'
const TITLES_URL = 'http://localhost:4000/api/titles'
const SYNC_URL = 'http://localhost:4000/api/sync-discord'
const ADMIN_NOTIFICATIONS_URL = 'http://localhost:4000/api/admin/notifications'
const ADMIN_TITLES_URL = 'http://localhost:4000/api/admin/titles'

export interface ReshuffleResult {
  selected: number
  pending: number
  preservedWatched: true
}

export interface TitleCorrectionResult {
  title: string
  category: string
  metadataUpdated: boolean
}

export interface NotificationTemplateSettings {
  content: string
  embedTitle: string
  embedDescription: string
  embedFooter: string
  showImage: boolean
}

export interface DiscordWebhookPayload {
  content?: string
  embeds?: Array<{
    title?: string
    description?: string
    footer?: { text?: string }
    color?: number
    timestamp?: string
    image?: { url: string }
  }>
}

async function adminRequest<T>(url: string, adminKey: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('x-admin-key', adminKey)
  if (init.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(url, { ...init, headers })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body as T
}

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

export async function resetMachine(adminKey: string): Promise<void> {
  await adminRequest(RESET_URL, adminKey, { method: 'POST' })
}

export async function deleteTitle(adminKey: string, id: string): Promise<void> {
  await adminRequest(`${ADMIN_TITLES_URL}/${encodeURIComponent(id)}`, adminKey, { method: 'DELETE' })
}

export async function correctTitle(
  adminKey: string,
  id: string,
  category: string,
  queryTitle?: string,
  year?: number,
): Promise<TitleCorrectionResult> {
  return adminRequest<TitleCorrectionResult>(
    `${ADMIN_TITLES_URL}/${encodeURIComponent(id)}/correction`,
    adminKey,
    {
      method: 'PATCH',
      body: JSON.stringify({ category, queryTitle, year }),
    },
  )
}

export async function reshuffleMachine(adminKey: string): Promise<ReshuffleResult> {
  return adminRequest<ReshuffleResult>(`${ADMIN_TITLES_URL}/reshuffle`, adminKey, { method: 'POST' })
}

export async function syncSuggestions(adminKey: string): Promise<{
  added: number
  messagesRead: number
  backfillComplete: boolean
  restartedForEmptyMedia: boolean
  ignored: Array<{ text: string; reason: string }>
  discarded: Array<{
    title: string
    reason: string
    bestMatch: string | null
    score: number
    threshold: number
  }>
  failed: Array<{ title: string; reason: string }>
}> {
  const body = await adminRequest<{
    added: number
    messagesRead: number
    backfillComplete: boolean
    restartedForEmptyMedia: boolean
    ignored: Array<{ text: string; reason: string }>
    discarded: Array<{
      title: string
      reason: string
      bestMatch: string | null
      score: number
      threshold: number
    }>
    failed: Array<{ title: string; reason: string }>
  }>(SYNC_URL, adminKey, { method: 'POST' })
  return {
    added: body.added ?? 0,
    messagesRead: body.messagesRead ?? 0,
    backfillComplete: body.backfillComplete ?? false,
    restartedForEmptyMedia: body.restartedForEmptyMedia ?? false,
    ignored: body.ignored ?? [],
    discarded: body.discarded ?? [],
    failed: body.failed ?? [],
  }
}

export async function getNotificationSettings(adminKey: string): Promise<{
  enabled: boolean
  settings: NotificationTemplateSettings
}> {
  return adminRequest<{ enabled: boolean; settings: NotificationTemplateSettings }>(
    ADMIN_NOTIFICATIONS_URL,
    adminKey,
  )
}

export async function saveNotificationSettings(
  adminKey: string,
  settings: NotificationTemplateSettings,
): Promise<NotificationTemplateSettings> {
  const body = await adminRequest<{ settings: NotificationTemplateSettings }>(
    `${ADMIN_NOTIFICATIONS_URL}/settings`,
    adminKey,
    {
      method: 'POST',
      body: JSON.stringify(settings),
    },
  )
  return body.settings
}

export async function setWebhookEnabled(adminKey: string, enabled: boolean): Promise<boolean> {
  const body = await adminRequest<{ enabled: boolean }>(`${ADMIN_NOTIFICATIONS_URL}/toggle`, adminKey, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  })
  return body.enabled === true
}

export async function previewNotification(
  adminKey: string,
  settings: NotificationTemplateSettings,
): Promise<DiscordWebhookPayload> {
  const body = await adminRequest<{ payload: DiscordWebhookPayload }>(
    `${ADMIN_NOTIFICATIONS_URL}/preview`,
    adminKey,
    { method: 'POST', body: JSON.stringify(settings) },
  )
  return body.payload
}

export async function sendTestNotification(
  adminKey: string,
  settings: NotificationTemplateSettings,
): Promise<void> {
  await adminRequest(`${ADMIN_NOTIFICATIONS_URL}/test`, adminKey, {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}