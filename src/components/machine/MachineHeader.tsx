import type { ReactNode } from 'react'
import { useClawMachine } from '../../context/ClawMachineContext'

const JAPAN_FLAG = (
  <span role="img" aria-label="Japan" style={{ fontSize: 22, lineHeight: 1 }}>
    🇯🇵
  </span>
)

function MovieBulbs({ count, reverse }: { count: number; reverse?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const idx = reverse ? count - 1 - i : i
        return (
          <span
            key={i}
            className="bulb-chaser w-3.5 h-3.5 rounded-full bg-amber-300 border border-black shadow-[0_0_6px_#f59e0b]"
            style={{ animationDelay: `${idx * 0.09}s`, flexShrink: 0 }}
          />
        )
      })}
    </>
  )
}

function MovieMarquee({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="relative w-full bg-[#800020] border-4 border-black px-4 pt-7 pb-7 flex items-center justify-center shadow-[6px_6px_0px_#000] mb-3.5">
      <div className="absolute top-1 left-1 right-1 flex justify-between">
        <MovieBulbs count={12} />
      </div>
      <div className="absolute bottom-1 left-1 right-1 flex justify-between">
        <MovieBulbs count={12} reverse />
      </div>
      <div className="absolute left-1 top-1 bottom-1 flex flex-col justify-between">
        <MovieBulbs count={5} />
      </div>
      <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-between">
        <MovieBulbs count={5} reverse />
      </div>

      <div className="relative z-10 w-[82%] bg-white bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_12px] border-4 border-slate-950 shadow-[4px_4px_0px_#000] py-2 px-3 text-center">
        <h2 className="font-mono font-black text-black tracking-widest text-base uppercase leading-tight">
          {emoji} {label}
        </h2>
        <p className="font-mono text-[10px] text-red-700 tracking-wider uppercase font-bold mt-1">
          ✦ Ahora en cines ✦
        </p>
      </div>
    </div>
  )
}

export function MachineHeader() {
  const { activeMachine } = useClawMachine()
  const t = activeMachine.theme

  if (t.marqueeVariant === 'broadway') {
    return <MovieMarquee emoji={activeMachine.emoji} label={activeMachine.label} />
  }

  const ink = '2px 2px 0 #000'
  let titleShadow = ink
  let decor: ReactNode = null

  if (t.marqueeVariant === 'manga') {
    decor = (
      <>
        <span style={{ display: 'flex', justifyContent: 'center' }}>{JAPAN_FLAG}</span>
      </>
    )
    titleShadow = '2px 2px 0 #000, 3px 3px 0 #000'
  } else if (t.marqueeVariant === 'glitch') {
    decor = <span style={{ color: '#f0abfc', fontWeight: 900, textShadow: ink }}>//</span>
    titleShadow = '2px 0 0 rgba(244,114,182,0.8), -2px 0 0 rgba(34,211,238,0.8)'
  }

  const title = (
    <span className="font-pixel" style={{
      fontSize: 11,
      letterSpacing: 2,
      fontWeight: 900,
      color: t.marqueeText,
      textAlign: 'center',
      textShadow: titleShadow,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ fontSize: 14 }}>{activeMachine.emoji}</span>
      {activeMachine.label.toUpperCase()}
    </span>
  )

  return (
    <div style={{
      position: 'relative',
      background: t.marqueeBg,
      border: '4px solid #000',
      borderRadius: 10,
      boxShadow: '6px 6px 0 #000',
      padding: '8px 10px',
      marginBottom: 14,
      transition: 'background-color .4s ease',
    }}>
      {t.marqueeVariant === 'tv' && (
        <span className="rec-blink" style={{
          position: 'absolute',
          top: 6,
          right: 8,
          color: '#ef4444',
          fontWeight: 900,
          fontSize: 11,
        }}>
          ● REC
        </span>
      )}
      {t.marqueeVariant === 'glitch' && (
        <span className="glitch-border-anim" style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(34, 211, 238, 0.8)',
          borderRadius: 10,
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '30%' }}>{decor}</div>
        {title}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, width: '30%' }}>{decor}</div>
      </div>
    </div>
  )
}