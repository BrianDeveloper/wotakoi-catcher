import { registerDiscordCommands } from './discord.js'

try {
  await registerDiscordCommands()
} catch (error) {
  console.error('[discord] No se pudieron registrar los comandos:', error.message)
  process.exitCode = 1
}
