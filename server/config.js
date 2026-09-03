import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const config = {
  port: Number(process.env.PORT) || 4000,
  discordToken: process.env.DISCORD_TOKEN || '',
  discordChannelId: process.env.DISCORD_CHANNEL_ID || '',
  discordLimit: Number(process.env.DISCORD_LIMIT) || 100,
  refreshIntervalMin: Number(process.env.REFRESH_INTERVAL_MIN) || 60,
}

export default config
