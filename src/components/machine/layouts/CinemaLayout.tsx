import { CabinetFrame } from './CabinetFrame'
import { MachineHeader } from '../MachineHeader'
import { CapsuleDome } from '../CapsuleDome'
import { ClawControls } from '../ClawControls'
import { MachineBasePanel } from '../MachineBasePanel'

export function CinemaLayout() {
  return (
    <CabinetFrame variant="movie">
      <MachineHeader />
      <div className="carpet-strip" style={{ height: 8, marginBottom: 14 }} />
      <CapsuleDome />
      <div className="deck-pedestal" style={{ margin: '14px 0' }}>
        <ClawControls />
      </div>
      <MachineBasePanel />
    </CabinetFrame>
  )
}