import type { MachineDef, MachineKey } from '../types'

export const MACHINES: MachineDef[] = [
  {
    key: 'anime', label: 'Máquina Anime', short: 'ANIME', emoji: '🍥',
    accent: '#22d3ee', main: '#a21caf', dark: '#701a75', light: '#ec4899',
    theme: {
      marqueeVariant: 'manga',
      marqueeBg: '#3b0764',
      marqueeText: '#fce7ff',
      marqueeAccent: '#22d3ee',
      cabinetBg: '#a21caf',
      domeEffect: 'none',
      domeBg: '#3b0764',
      controlsAccent: '#22d3ee',
    },
  },
  {
    key: 'movie', label: 'Máquina Películas', short: 'PELIS', emoji: '🎬',
    accent: '#f59e0b', main: '#991b1b', dark: '#7f1d1d', light: '#fbbf24',
    theme: {
      marqueeVariant: 'broadway',
      marqueeBg: '#7f1d1d',
      marqueeText: '#fcd34d',
      marqueeAccent: '#fcd34d',
      cabinetBg: '#09090b',
      domeEffect: 'none',
      domeBg: '#450a0a',
      controlsAccent: '#f59e0b',
    },
  },
  {
    key: 'series', label: 'Máquina Series', short: 'SERIES', emoji: '📺',
    accent: '#a3e635', main: '#166534', dark: '#14532d', light: '#4ade80',
    theme: {
      marqueeVariant: 'tv',
      marqueeBg: '#0B1D3A',
      marqueeText: '#f1f5f9',
      marqueeAccent: '#f77f00',
      cabinetBg: '#0B1D3A',
      domeEffect: 'scanlines',
      domeBg: '#0B1D3A',
      controlsAccent: '#f77f00',
    },
  },
  {
    key: 'mix', label: 'Máquina Mix', short: 'MIX', emoji: '👾',
    accent: '#22d3ee', main: '#3b0764', dark: '#1e1b4b', light: '#9333ea',
    theme: {
      marqueeVariant: 'glitch',
      marqueeBg: '#150a26',
      marqueeText: '#f8fafc',
      marqueeAccent: '#22d3ee',
      cabinetBg: '#150a26',
      domeEffect: 'glitchbars',
      domeBg: '#0f0a18',
      controlsAccent: '#e879f9',
    },
  },
]

export const MACHINE_QUERY_PARAM: Record<MachineKey, string> = {
  anime: 'anime',
  movie: 'movie',
  series: 'series',
  mix: 'mix',
}