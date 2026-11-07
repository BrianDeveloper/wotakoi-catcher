import { registerDiscordCommands } from './discord.js'

try {
  await registerDiscordCommands()
} catch (error) {
  console.error('[discord] No se pudo registrar /sugerir:', error.message)
  process.exitCode = 1
}
