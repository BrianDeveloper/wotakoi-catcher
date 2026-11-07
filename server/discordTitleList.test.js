import test from 'node:test'
import assert from 'node:assert/strict'
import { createTitleListResponse } from './discordTitleList.js'

test('creates a paginated title list with category and state', () => {
  const response = createTitleListResponse({
    titles: [
      { title: 'My *Anime*', category: 'anime', status: 'IN_MACHINE' },
      { title: 'Film', category: 'movie', status: 'WATCHED' },
    ],
    count: 21,
    page: 1,
    category: null,
  })

  assert.ok(response.embeds[0].description.includes('My \\*Anime\\*'))
  assert.match(response.embeds[0].description, /Anime · En máquina/)
  assert.match(response.embeds[0].description, /Película · Visto/)
  assert.match(response.embeds[0].footer.text, /21 títulos · Página 1\/2/)
  assert.equal(response.components[0].components[0].disabled, true)
  assert.equal(response.components[0].components[1].custom_id, 'titles:all:2')
  assert.deepEqual(response.allowed_mentions.parse, [])
})

test('disables both navigation buttons for an empty list', () => {
  const response = createTitleListResponse({
    titles: [],
    count: 0,
    page: 1,
    category: 'series',
  })

  assert.equal(response.embeds[0].description, 'No hay títulos registrados en esta categoría.')
  assert.equal(response.components[0].components[0].disabled, true)
  assert.equal(response.components[0].components[1].disabled, true)
  assert.match(response.embeds[0].footer.text, /Serie · 0 títulos/)
})
