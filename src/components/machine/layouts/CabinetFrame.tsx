import type { ReactNode } from 'react'
import type { MachineKey } from '../../../types'
import { useClawMachine } from '../../../context/ClawMachineContext'

export function CabinetFrame({ variant, children }: { variant: MachineKey; children: ReactNode }) {
  const { activeMachine } = useClawMachine()
  const t = activeMachine.theme

  return (
    <div
      className="machine-cabinet"
      data-layout={variant}
      style={{
        padding: '16px 16px 14px',
        position: 'relative',
        background: t.cabinetBg,
        border: '4px solid #000',
        boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.12), 6px 6px 0 #000',
        transition: 'background-color .4s ease, box-shadow .4s ease',
      }}
    >
      {children}
    </div>
  )
}