import { CabinetFrame } from './CabinetFrame'
import { MachineHeader } from '../MachineHeader'
import { CapsuleDome } from '../CapsuleDome'
import { ClawControls } from '../ClawControls'
import { MachineBasePanel } from '../MachineBasePanel'

export function AnimeLayout() {
  return (
    <CabinetFrame variant="anime">
      <div style={{ marginBottom: 14 }}>
        <MachineHeader />
      </div>
      <div className="ben-dot" style={{ position: 'relative', marginBottom: 14 }}>
        <div className="clip-corners" style={{ padding: 8 }}>
          <CapsuleDome />
        </div>
      </div>
      <ClawControls />
      <MachineBasePanel />
    </CabinetFrame>
  )
}