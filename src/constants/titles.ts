import type { MachineKey, TitleStatus } from '../types'

export interface TitleStatusMeta {
  label: string
  emoji: string
  color: string
}

export const STATUS_META: Record<string, TitleStatusMeta> = {
  PENDING: { label: 'En cola', emoji: '🗂', color: '#f59e0b' },
  IN_MACHINE: { label: 'En máquina', emoji: '🎰', color: '#22d3ee' },
  WATCHING: { label: 'Viendo', emoji: '👀', color: '#a78bfa' },
  WATCHED: { label: 'Visto', emoji: '✅', color: '#4ade80' },
}

export const STATUS_ORDER: TitleStatus[] = ['PENDING', 'IN_MACHINE', 'WATCHING', 'WATCHED']

export type TitleFilter = 'all' | MachineKey

export const LIBRARY_FILTERS: { key: TitleFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '📚' },
  { key: 'anime', label: 'Anime', emoji: '🍥' },
  { key: 'movie', label: 'Películas', emoji: '🎬' },
  { key: 'series', label: 'Series', emoji: '📺' },
]

export type StatusFilter = 'all' | keyof typeof STATUS_META

export const STATUS_FILTERS: { key: StatusFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '📌' },
  ...STATUS_ORDER.map((status) => ({
    key: status,
    label: STATUS_META[status].label,
    emoji: STATUS_META[status].emoji,
  })),
]

export function statusMeta(status?: string): TitleStatusMeta {
  return STATUS_META[status || ''] || { label: status || '—', emoji: '🏷', color: 'var(--c-text-light)' }
}