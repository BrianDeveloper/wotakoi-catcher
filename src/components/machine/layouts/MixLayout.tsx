import { CabinetFrame } from './CabinetFrame'
import { MachineHeader } from '../MachineHeader'
import { CapsuleDome } from '../CapsuleDome'
import { ClawControls } from '../ClawControls'
import { MachineBasePanel } from '../MachineBasePanel'

export function MixLayout() {
  return (
    <CabinetFrame variant="mix">
      <div style={{ marginBottom: 14 }}>
        <MachineHeader />
      </div>
      <div style={{ transform: 'rotate(0.5deg) translateX(4px)', marginBottom: 14 }}>
        <CapsuleDome />
      </div>
      <ClawControls />
      <MachineBasePanel />
    </CabinetFrame>
  )
}