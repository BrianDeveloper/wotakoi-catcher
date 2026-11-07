import { startBot } from './discord.js'

try {
  await startBot()
} catch (error) {
  console.error('[discord] No se pudo iniciar el worker:', error.message)
  process.exit(1)
}
