import { motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { CONTROL_BUTTONS, STATE_COLORS } from '../../constants/theme'

export function ClawControls() {
  const { machineState, remaining, isShaking, startMoving, stopMoving, handleShake, handlePlay, activeMachine } = useClawMachine()
  const controlsAccent = activeMachine.theme.controlsAccent
  const canPlay = machineState === 'idle' && remaining.length > 0

  return (
    <div className="control-panel w-full px-3 py-2 flex items-center justify-between overflow-hidden" style={{ height: 88 }}>
      {/* Movement Controls */}
      <div className="flex gap-2 items-center shrink-0">
        <motion.button
          className="w-12 h-12"
          whileTap={machineState === 'idle' ? { y: 3, scale: 0.92 } : {}}
          onMouseDown={() => startMoving('left')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={() => startMoving('left')}
          onTouchEnd={stopMoving}
          onTouchCancel={stopMoving}
          disabled={machineState !== 'idle'}
          style={{
            borderRadius: '50%',
            background: machineState === 'idle' ? controlsAccent : '#334155',
            border: '3px solid #111827',
            color: STATE_COLORS.white,
            fontSize: 22,
            cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' ? '0 5px 0 #111827, inset 0 2px 0 rgba(255,255,255,0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'background-color .3s ease, box-shadow .3s ease'
          }}
        >
          ◀
        </motion.button>
        <motion.button
          className="w-12 h-12"
          whileTap={machineState === 'idle' ? { y: 3, scale: 0.92 } : {}}
          onMouseDown={() => startMoving('right')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={() => startMoving('right')}
          onTouchEnd={stopMoving}
          onTouchCancel={stopMoving}
          disabled={machineState !== 'idle'}
          style={{
            borderRadius: '50%',
            background: machineState === 'idle' ? controlsAccent : '#334155',
            border: '3px solid #111827',
            color: STATE_COLORS.white,
            fontSize: 22,
            cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' ? '0 5px 0 #111827, inset 0 2px 0 rgba(255,255,255,0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'background-color .3s ease, box-shadow .3s ease'
          }}
        >
          ▶
        </motion.button>
      </div>

      {/* Status Text */}
      <div className="font-pixel flex-1 min-w-0 truncate text-center hidden min-[440px]:block" style={{
        fontSize: 8,
        letterSpacing: '1px',
        color: 'var(--c-text-main)',
        textTransform: 'uppercase',
        textAlign: 'center',
        textShadow: `0 0 6px ${controlsAccent}`,
      }}>
        {machineState !== 'idle' && machineState !== 'dispensed' && machineState !== 'empty' && 'PLAYING...'}
        {machineState === 'dispensed' && '¡PREMIO!'}
        {machineState === 'empty' && 'AGOTADO'}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 items-center shrink-0">
        {/* Shake Button */}
        <motion.button
          className="w-12 h-12"
          whileTap={machineState === 'idle' && !isShaking ? { y: 3, scale: 0.92 } : {}}
          onClick={handleShake}
          disabled={machineState !== 'idle' || isShaking || remaining.length === 0}
          style={{
            borderRadius: '50%',
            background: machineState === 'idle' && !isShaking ? CONTROL_BUTTONS.shakeBgActive : CONTROL_BUTTONS.shakeBgDisabled,
            border: `3px solid ${CONTROL_BUTTONS.shakeBorder}`,
            color: STATE_COLORS.white,
            cursor: machineState === 'idle' && !isShaking ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' && !isShaking ? '0 5px 0 #b45309, inset 0 2px 0 rgba(255,255,255,0.3)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0
          }}
        >
          <span style={{ fontSize: 20 }}>🔄️</span>
        </motion.button>

        {/* Big Play Button */}
        <motion.span
          animate={
            canPlay
              ? {
                  boxShadow: [
                    '0 0 0 3px color-mix(in srgb, var(--c-machine-accent) 65%, transparent), 0 0 16px 2px color-mix(in srgb, var(--c-machine-accent) 50%, transparent)',
                    '0 0 0 3px color-mix(in srgb, var(--c-machine-accent) 30%, transparent), 0 0 7px 1px color-mix(in srgb, var(--c-machine-accent) 25%, transparent)',
                    '0 0 0 3px color-mix(in srgb, var(--c-machine-accent) 65%, transparent), 0 0 16px 2px color-mix(in srgb, var(--c-machine-accent) 50%, transparent)',
                  ],
                }
              : { boxShadow: 'none' }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ borderRadius: '50%', display: 'flex' }}
        >
          <button
            className={`play-button w-14 h-14 ${machineState !== 'idle' ? 'active' : ''}`}
            disabled={machineState !== 'idle' || remaining.length === 0}
            onClick={handlePlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: STATE_COLORS.white, fontSize: 14, fontWeight: 900 }}>GO</span>
          </button>
        </motion.span>
      </div>
    </div>
  )
}