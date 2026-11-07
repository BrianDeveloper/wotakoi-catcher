import type { ComponentType } from 'react'
import type { MachineKey } from '../../types'
import { useClawMachine } from '../../context/ClawMachineContext'
import { AnimeLayout } from './layouts/AnimeLayout'
import { CinemaLayout } from './layouts/CinemaLayout'
import { SeriesLayout } from './layouts/SeriesLayout'
import { MixLayout } from './layouts/MixLayout'

const LAYOUTS: Record<MachineKey, ComponentType> = {
  anime: AnimeLayout,
  movie: CinemaLayout,
  series: SeriesLayout,
  mix: MixLayout,
}

export function ClawCabinet() {
  const { activeMachine } = useClawMachine()
  const Layout = LAYOUTS[activeMachine.key]
  return <Layout />
}