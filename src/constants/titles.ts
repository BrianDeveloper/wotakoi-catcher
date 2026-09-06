import type { MachineKey } from '../types'

export interface TitleStatusMeta {
  label: string
  emoji: string
  color: string
}

export const STATUS_META: Record<string, TitleStatusMeta> = {
  PENDING: { label: 'En cola', emoji: '🗂', color: '#f59e0b' },
  IN_MACHINE: { label: 'En máquina', emoji: '🎰', color: '#22d3ee' },
  WATCHED: { label: 'Visto', emoji: '✅', color: '#4ade80' },
}

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
  { key: 'PENDING', label: STATUS_META.PENDING.label, emoji: STATUS_META.PENDING.emoji },
  { key: 'IN_MACHINE', label: STATUS_META.IN_MACHINE.label, emoji: STATUS_META.IN_MACHINE.emoji },
  { key: 'WATCHED', label: STATUS_META.WATCHED.label, emoji: STATUS_META.WATCHED.emoji },
]

export function statusMeta(status?: string): TitleStatusMeta {
  return STATUS_META[status || ''] || { label: status || '—', emoji: '🏷', color: 'var(--c-text-light)' }
}