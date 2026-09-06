import type { MachineDef, MachineKey } from '../types'

export const MACHINES: MachineDef[] = [
  { key: 'anime', label: 'Máquina Anime', short: 'ANIME', emoji: '🍥',
    accent: '#22d3ee', main: '#a21caf', dark: '#701a75', light: '#ec4899' },
  { key: 'movie', label: 'Máquina Películas', short: 'PELIS', emoji: '🎬',
    accent: '#f59e0b', main: '#991b1b', dark: '#7f1d1d', light: '#fbbf24' },
  { key: 'series', label: 'Máquina Series', short: 'SERIES', emoji: '📺',
    accent: '#a3e635', main: '#166534', dark: '#14532d', light: '#4ade80' },
  { key: 'mix', label: 'Máquina Mix', short: 'MIX', emoji: '👾',
    accent: '#22d3ee', main: '#3b0764', dark: '#1e1b4b', light: '#9333ea' },
]

export const MACHINE_QUERY_PARAM: Record<MachineKey, string> = {
  anime: 'anime',
  movie: 'movie',
  series: 'series',
  mix: 'mix',
}