import { AnimatePresence } from 'framer-motion'
import { useClawMachine } from './context/ClawMachineContext'
import type { ThemeStyle } from './types'
import { SHADOWS, STATE_COLORS } from './constants/theme'
import { MachineSelector } from './components/machine/MachineSelector'
import { CapsuleModal } from './components/modals/CapsuleModal'
import { HistoryDrawer } from './components/history/HistoryDrawer'
import { TitlesDrawer } from './components/library/TitlesDrawer'
import { AdminControls } from './components/admin/AdminControls'

export default function GachaponViewer() {
  const { activeMachine, loading, loadError, openHistory, openLibrary, modalAnime, handleCloseModal } = useClawMachine()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px 40px',
      // Tema cromático según máquina activa
      '--c-machine-main': activeMachine.main,
      '--c-machine-dark': activeMachine.dark,
      '--c-machine-light': activeMachine.light,
      '--c-machine-accent': activeMachine.accent,
    } as ThemeStyle}>

      {/* Library toggle (discreto, fijo arriba-derecha) */}
      <button
        onClick={openLibrary}
        title="Biblioteca de títulos"
        aria-label="Abrir biblioteca"
        style={{
          position: 'fixed',
          top: 14,
          right: 64,
          zIndex: 120,
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'var(--c-machine-dark)',
          border: '2px solid var(--c-machine-light)',
          color: 'var(--c-text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          boxShadow: SHADOWS.floating,
        }}
      >
        📚
      </button>

      {/* History toggle (discreto, fijo arriba-derecha) */}
      <button
        onClick={openHistory}
        title="Historial de títulos"
        aria-label="Abrir historial"
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 120,
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'var(--c-machine-dark)',
          border: '2px solid var(--c-machine-light)',
          color: 'var(--c-text-main)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          boxShadow: SHADOWS.floating,
        }}
      >
        🕘
      </button>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(32px, 6vw, 42px)',
          fontWeight: 900,
          color: 'var(--c-text-main)',
          textShadow: '2px 2px 0px var(--c-machine-dark), 4px 4px 0px var(--c-machine-light)',
          letterSpacing: '2px'
        }}>
          WOTAKOI-CATCHER
        </h1>
        <p style={{ margin: '8px 0 0', fontWeight: 700, color: 'var(--c-text-light)' }}>
          ¡Descubre tu próximo anime!
        </p>
        <AdminControls />
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div style={{ textAlign: 'center', marginBottom: 20, fontWeight: 700, color: 'var(--c-text-light)' }}>
          Cargando premios…
        </div>
      )}
      {!loading && loadError && (
        <div style={{
          textAlign: 'center', marginBottom: 20, fontWeight: 700,
          color: STATE_COLORS.error, maxWidth: 340, fontSize: 13, lineHeight: 1.5,
        }}>
          {`No se pudo conectar al backend (${loadError}). Mostrando datos de demostración.`}
        </div>
      )}

      <MachineSelector />

      {/* Footer */}
      <p style={{
        marginTop: 30,
        fontSize: 12,
        color: 'var(--c-text-light)',
        fontWeight: 700,
      }}>
        © Wotakoi Arcade
      </p>

      {/* Modal */}
      <AnimatePresence>
        {modalAnime && (
          <CapsuleModal
            anime={modalAnime}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <HistoryDrawer />

      {/* Library Drawer */}
      <TitlesDrawer />
    </div>
  )
}