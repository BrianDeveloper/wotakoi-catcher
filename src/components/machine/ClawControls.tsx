import { motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { CONTROL_BUTTONS, STATE_COLORS } from '../../constants/theme'

export function ClawControls() {
  const { machineState, remaining, isShaking, startMoving, stopMoving, handleShake, handlePlay } = useClawMachine()

  return (
    <div className="control-panel" style={{
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 80
    }}>
      {/* Movement Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <motion.button
          whileTap={machineState === 'idle' ? { scale: 0.9, y: 4 } : {}}
          onMouseDown={() => startMoving('left')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={() => startMoving('left')}
          onTouchEnd={stopMoving}
          onTouchCancel={stopMoving}
          disabled={machineState !== 'idle'}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: machineState === 'idle' ? CONTROL_BUTTONS.joystickBgActive : CONTROL_BUTTONS.joystickBgDisabled,
            border: `3px solid ${CONTROL_BUTTONS.joystickBorder}`,
            color: STATE_COLORS.white,
            fontSize: 20,
            cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' ? CONTROL_BUTTONS.joystickShadow : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          ◀
        </motion.button>
        <motion.button
          whileTap={machineState === 'idle' ? { scale: 0.9, y: 4 } : {}}
          onMouseDown={() => startMoving('right')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={() => startMoving('right')}
          onTouchEnd={stopMoving}
          onTouchCancel={stopMoving}
          disabled={machineState !== 'idle'}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: machineState === 'idle' ? CONTROL_BUTTONS.joystickBgActive : CONTROL_BUTTONS.joystickBgDisabled,
            border: `3px solid ${CONTROL_BUTTONS.joystickBorder}`,
            color: STATE_COLORS.white,
            fontSize: 20,
            cursor: machineState === 'idle' ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' ? CONTROL_BUTTONS.joystickShadow : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          ▶
        </motion.button>
      </div>

      {/* Status Text */}
      <div style={{
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--c-text-main)',
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: '1px'
      }}>
        {machineState === 'idle' && remaining.length > 0 && '¡PRESIONA GO!'}
        {machineState !== 'idle' && machineState !== 'dispensed' && machineState !== 'empty' && 'PLAYING...'}
        {machineState === 'dispensed' && '¡PREMIO!'}
        {machineState === 'empty' && 'AGOTADO'}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Shake Button */}
        <motion.button
          whileTap={machineState === 'idle' && !isShaking ? { scale: 0.9, y: 4 } : {}}
          onClick={handleShake}
          disabled={machineState !== 'idle' || isShaking || remaining.length === 0}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: machineState === 'idle' && !isShaking ? CONTROL_BUTTONS.shakeBgActive : CONTROL_BUTTONS.shakeBgDisabled,
            border: `3px solid ${CONTROL_BUTTONS.shakeBorder}`,
            color: STATE_COLORS.white,
            cursor: machineState === 'idle' && !isShaking ? 'pointer' : 'not-allowed',
            boxShadow: machineState === 'idle' && !isShaking ? CONTROL_BUTTONS.shakeShadow : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0
          }}
        >
          <span style={{ fontSize: 18 }}>🔄️</span>
        </motion.button>

        {/* Big Play Button */}
        <button
          className={`play-button ${machineState !== 'idle' ? 'active' : ''}`}
          disabled={machineState !== 'idle' || remaining.length === 0}
          onClick={handlePlay}
          style={{
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: STATE_COLORS.white, fontSize: 12, fontWeight: 900 }}>GO</span>
        </button>
      </div>
    </div>
  )
}