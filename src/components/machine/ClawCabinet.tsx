import { Star } from 'lucide-react'
import { useClawMachine } from '../../context/ClawMachineContext'
import { CapsuleDome } from './CapsuleDome'
import { ClawControls } from './ClawControls'
import { MachineBasePanel } from './MachineBasePanel'

export function ClawCabinet() {
  const { activeMachine } = useClawMachine()

  return (
    <div className="machine-cabinet" style={{
      padding: '16px 16px 0',
      position: 'relative',
    }}>
      {/* Header Marquee */}
      <div style={{
        background: 'var(--c-machine-dark)',
        borderRadius: 8,
        padding: '6px',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '2px solid var(--c-machine-light)'
      }}>
        <Star size={14} color="var(--c-machine-accent)" fill="var(--c-machine-accent)" />
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1,
          color: 'var(--c-text-main)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>{activeMachine.emoji}</span>
          {activeMachine.label.toUpperCase()}
        </span>
        <Star size={14} color="var(--c-machine-accent)" fill="var(--c-machine-accent)" />
      </div>

      <CapsuleDome />
      <ClawControls />
      <MachineBasePanel />
    </div>
  )
}