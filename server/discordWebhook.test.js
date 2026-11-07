import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildWebhookPayload,
  DEFAULT_NOTIFICATION_SETTINGS,
  validateNotificationSettings,
} from './discordWebhook.js'

test('validates notification templates and rejects unknown variables', () => {
  const invalid = validateNotificationSettings({
    ...DEFAULT_NOTIFICATION_SETTINGS,
    content: 'Title: {unknown}',
  })

  assert.match(invalid.error, /no permitida/)
})

test('renders configured placeholders without enabling Discord mentions', () => {
  const payload = buildWebhookPayload({
    title: 'Frieren',
    category: 'anime',
    synopsis: 'Una aventura.',
    suggested_by: '@everyone',
  }, {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    content: 'Nueva obra: {title} ({category})',
    embedTitle: '{title}',
    embedDescription: '{synopsis}',
    embedFooter: 'Sugerida por {suggested_by}',
    showImage: false,
  })

  assert.equal(payload.content, 'Nueva obra: Frieren (Anime)')
  assert.equal(payload.embeds[0].title, 'Frieren')
  assert.equal(payload.embeds[0].description, 'Una aventura.')
  assert.equal(payload.allowed_mentions.parse.length, 0)
  assert.equal(payload.embeds[0].image, undefined)
})
