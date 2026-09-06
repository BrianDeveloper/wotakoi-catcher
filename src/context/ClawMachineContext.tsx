import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useClawGame } from '../hooks/useClawGame'

type ClawGameApi = ReturnType<typeof useClawGame>

const ClawMachineContext = createContext<ClawGameApi | null>(null)

export function ClawMachineProvider({ children }: { children: ReactNode }) {
  const game = useClawGame()
  return (
    <ClawMachineContext.Provider value={game}>
      {children}
    </ClawMachineContext.Provider>
  )
}

export function useClawMachine(): ClawGameApi {
  const ctx = useContext(ClawMachineContext)
  if (!ctx) throw new Error('useClawMachine debe usarse dentro de <ClawMachineProvider>')
  return ctx
}