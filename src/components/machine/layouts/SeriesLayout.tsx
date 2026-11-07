import { CabinetFrame } from './CabinetFrame'
import { MachineHeader } from '../MachineHeader'
import { CapsuleDome } from '../CapsuleDome'
import { ClawControls } from '../ClawControls'
import { MachineBasePanel } from '../MachineBasePanel'

const GRILL_DOTS = Array.from({ length: 14 }, (_, i) => i)

export function SeriesLayout() {
  return (
    <CabinetFrame variant="series">
      <MachineHeader />
      <div
        className="tv-bezel"
        style={{
          position: 'relative',
          background: '#12233f',
          border: '6px solid #0a1628',
          borderRadius: 14,
          boxShadow: '6px 6px 0 #000, inset 0 0 0 2px #2a3b56',
          padding: 10,
          marginBottom: 10,
        }}
      >
        <CapsuleDome />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            alignItems: 'center',
            height: 18,
            marginTop: 6,
          }}
        >
          {GRILL_DOTS.map((i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22395c', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>
      <div
        className="brand-plate"
        style={{
          textAlign: 'center',
          fontSize: 9,
          letterSpacing: 3,
          fontWeight: 900,
          fontFamily: 'monospace',
          color: '#f1f5f9',
          textShadow: '2px 2px 0 #000',
          padding: '2px 0 10px',
        }}
      >
        WOTAKOI-3000 • ON AIR
      </div>
      <ClawControls />
      <MachineBasePanel />
    </CabinetFrame>
  )
}