import type { CSSProperties } from 'react'

export interface AnimeEntry {
  id: string
  title: string
  genre: string
  allGenres?: string
  image: string
  synopsis: string
  capsuleColor: string
  category?: string
  status?: string
  suggested_by?: string
  createdAt?: string
  consumedAt?: string
}

export type MachineKey = 'anime' | 'movie' | 'series' | 'mix'

export type MarqueeVariant = 'manga' | 'broadway' | 'tv' | 'glitch'

export type DomeEffect = 'scanlines' | 'glitchbars' | 'none'

export interface MachineTheme {
  marqueeVariant: MarqueeVariant
  marqueeBg: string
  marqueeText: string
  marqueeAccent: string
  cabinetBg: string
  domeEffect: DomeEffect
  domeBg: string
  controlsAccent: string
}

export interface MachineDef {
  key: MachineKey
  label: string
  short: string
  emoji: string
  accent: string
  main: string
  dark: string
  light: string
  theme: MachineTheme
}

export type MachineState = 'idle' | 'moving_x' | 'moving_y_down' | 'grabbing' | 'moving_y_up' | 'returning' | 'dropping' | 'dispensed' | 'empty'

export interface CapsulePosition {
  x: number
  y: number
  rotation: number
}

export interface CapsuleBallProps {
  color: string
  size?: number
  style?: CSSProperties
}

/** Variables CSS cromáticas establecidas según la máquina activa */
export interface ThemeStyle extends CSSProperties {
  '--c-machine-main'?: string
  '--c-machine-dark'?: string
  '--c-machine-light'?: string
  '--c-machine-accent'?: string
}

/** Nodo de partida para simulatePacking (posiciones existentes + impulsos opcionales) */
export interface InitialNode {
  x: number
  y: number
  rotation: number
  vx?: number
  vy?: number
}