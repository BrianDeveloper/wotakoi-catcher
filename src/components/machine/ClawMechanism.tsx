import { motion } from 'framer-motion'
import { useClawMachine } from '../../context/ClawMachineContext'
import { METAL } from '../../constants/theme'
import { CapsuleBall } from '../ui/CapsuleBall'

export function ClawMechanism() {
  const { clawXControls, clawYControls, clawProngsControls, grabbedCapsuleControls, grabbedAnime, chuteX } = useClawMachine()

  return (
    <motion.div
      animate={clawXControls}
      initial={{ x: chuteX }}
      style={{
        position: 'absolute',
        top: 12,
        left: 0,
        width: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 4,
        marginLeft: -20 // center on X coordinate
      }}
    >
      <div style={{
        width: 24,
        height: 16,
        background: METAL.motorBg,
        border: `2px solid ${METAL.motorBorder}`,
        borderRadius: 4
      }} />

      <motion.div
        animate={clawYControls}
        initial={{ height: 20 }}
        style={{
          width: 4,
          background: METAL.arm,
          originY: 0
        }}
      />

      <div style={{
        width: 20,
        height: 12,
        background: METAL.headBg,
        border: `2px solid ${METAL.headBorder}`,
        borderRadius: '4px 4px 0 0',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <motion.div
          animate={clawProngsControls}
          style={{
            position: 'absolute',
            top: 10,
            left: 2,
            width: 4,
            height: 24,
            background: METAL.prong,
            borderRadius: 2,
            originY: 0,
            originX: 1,
            rotate: 15
          }}
        />
        <motion.div
          animate={clawProngsControls}
          style={{
            position: 'absolute',
            top: 10,
            right: 2,
            width: 4,
            height: 24,
            background: METAL.prong,
            borderRadius: 2,
            originY: 0,
            originX: 0,
            rotate: -15
          }}
        />

        <motion.div
          animate={grabbedCapsuleControls}
          initial={{ opacity: 0, y: 0 }}
          style={{
            position: 'absolute',
            top: 18,
            zIndex: -1
          }}
        >
          {grabbedAnime ? (
            <CapsuleBall color={grabbedAnime.capsuleColor} size={40} />
          ) : (
            <CapsuleBall color="transparent" size={40} />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}