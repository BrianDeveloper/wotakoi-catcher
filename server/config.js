import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const config = {
  port: Number(process.env.PORT) || 4000,
  discordToken: process.env.DISCORD_TOKEN || '',
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordGuildId: process.env.DISCORD_GUILD_ID || '',
  discordChannelId: process.env.DISCORD_CHANNEL_ID || '',
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  discordLimit: Number(process.env.DISCORD_LIMIT) || 100,
  refreshIntervalMin: Number(process.env.REFRESH_INTERVAL_MIN) || 60,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  adminSecretKey: process.env.ADMIN_SECRET_KEY || '',
}

export default config
