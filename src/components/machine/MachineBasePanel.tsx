import { AnimatePresence, motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { PRIZE_PULSE } from '../../constants/animations'
import { CapsuleBall } from '../ui/CapsuleBall'

export function MachineBasePanel() {
  const { dispensed, machineState, handleOpenCapsule, activeMachine } = useClawMachine()

  return (
    <div
      className="w-full border-4 border-black p-4 shadow-[6px_6px_0px_#000]"
      style={{ background: activeMachine.theme.cabinetBg }}
    >
      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Columna Izquierda: Depósito de Premios */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-xs font-black text-amber-300 uppercase tracking-widest drop-shadow-[1px_1px_0px_#000]">
            Premio
          </span>
          <div className="w-28 h-16 bg-zinc-950 border-3 border-black shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] rounded-md flex flex-col items-center justify-end gap-1 pb-1 overflow-hidden">
            <AnimatePresence>
              {dispensed && (
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleOpenCapsule}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <CapsuleBall color={dispensed.capsuleColor} size={44} />
                  <motion.div
                    animate={PRIZE_PULSE.animate}
                    transition={PRIZE_PULSE.transition}
                    style={{
                      position: 'absolute',
                      inset: -4,
                      border: `2px solid ${dispensed.capsuleColor}`,
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-20 h-2 bg-zinc-800 border-t border-zinc-700" />
          </div>
        </div>

        {/* Columna Derecha: Monedero e Instrucciones */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-full max-w-[140px] bg-gradient-to-b from-slate-200 to-slate-400 border-3 border-t-white border-l-white border-r-slate-800 border-b-slate-800 p-2 shadow-[3px_3px_0px_#000] rounded flex items-center justify-center gap-2 select-none">
            <div className="w-1.5 h-5 bg-black border-r border-slate-400 rounded-sm" />
            <span className="font-mono font-extrabold text-black text-sm tracking-tight">100¥</span>
          </div>
          <p className="font-mono text-[10px] text-amber-200 font-bold uppercase tracking-wider text-center leading-tight">
            {machineState === 'dispensed' ? '↑ ¡Toca tu premio!' : 'Inserta una moneda y presiona GO!'}
          </p>
        </div>
      </div>
    </div>
  )
}