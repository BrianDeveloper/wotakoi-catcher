import { ClawMachineProvider } from './context/ClawMachineContext'
import GachaponViewer from './GachaponViewer.tsx'

export default function App() {
  return (
    <ClawMachineProvider>
      <GachaponViewer />
    </ClawMachineProvider>
  )
}