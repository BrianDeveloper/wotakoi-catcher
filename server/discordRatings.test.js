import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAutocompleteResponse,
  buildHelpResponse,
  buildRankingResponse,
  buildRatingResponse,
  getRankingRequest,
} from './discordRatings.js'

test('construye un podio fijo y numera el resto desde el cuarto puesto', () => {
  const response = buildRankingResponse({
    podium: [
      { title: 'Uno', averageScore: 9.5, ratingCount: 4 },
      { title: 'Dos', averageScore: 9, ratingCount: 3 },
      { title: 'Tres', averageScore: 8.5, ratingCount: 2 },
    ],
    rest: [
      { title: 'Cuatro', averageScore: 8, ratingCount: 1 },
      { title: 'Cinco', averageScore: 7.5, ratingCount: 1 },
    ],
    total: 5,
    page: 1,
    pageCount: 1,
    category: 'anime',
  })

  const embed = response.embeds[0]
  assert.match(embed.title, /Anime/)
  assert.match(embed.description, /🥇 \*\*Uno\*\* — ⭐ 9\.5 · 4 votos/)
  assert.match(embed.description, /🥈 \*\*Dos\*\* — ⭐ 9\.0 · 3 votos/)
  assert.match(embed.description, /🥉 \*\*Tres\*\* — ⭐ 8\.5 · 2 votos/)
  assert.match(embed.description, /4\. \*\*Cuatro\*\* — ⭐ 8\.0 · 1 voto/)
  assert.match(embed.description, /5\. \*\*Cinco\*\* — ⭐ 7\.5 · 1 voto/)
  assert.match(embed.footer.text, /5 obras calificadas/)
  assert.equal(response.components[0].components[0].disabled, true)
  assert.equal(response.components[0].components[1].disabled, true)
  assert.deepEqual(response.allowed_mentions.parse, [])
})

test('mantiene el podio fijo y numera el resto según la página', () => {
  const rest = Array.from({ length: 10 }, (_, index) => ({
    title: `Obra *${index + 11}*`,
    averageScore: 5 - index / 10,
    ratingCount: 1,
  }))
  const response = buildRankingResponse({
    podium: [
      { title: 'Uno', averageScore: 9.5, ratingCount: 4 },
      { title: 'Dos', averageScore: 9, ratingCount: 3 },
      { title: 'Tres', averageScore: 8.5, ratingCount: 2 },
    ],
    rest,
    total: 33,
    page: 2,
    pageCount: 3,
    category: null,
  })

  const embed = response.embeds[0]
  const lines = embed.description.split('\n')
  assert.equal(lines.length, 13)
  assert.match(lines[3], /^14\. \*\*Obra \\\*11\\\*\*/)
  assert.match(lines[12], /^23\. \*\*Obra \\\*20\\\*\*/)
  assert.match(embed.title, /Todas las categorías/)
  assert.match(embed.footer.text, /Página 2\/3/)
  assert.equal(response.components[0].components[0].custom_id, 'ranking:all:1')
  assert.equal(response.components[0].components[0].disabled, false)
  assert.equal(response.components[0].components[1].custom_id, 'ranking:all:3')
  assert.equal(response.components[0].components[1].disabled, false)
})

test('muestra un estado vacío sin calificaciones', () => {
  const response = buildRankingResponse({
    podium: [],
    rest: [],
    total: 0,
    page: 1,
    pageCount: 1,
    category: 'series',
  })
  const embed = response.embeds[0]

  assert.match(embed.description, /\/calificar/)
  assert.match(embed.footer.text, /Serie · 0 obras calificadas/)
})

test('interpreta el comando y los botones de página del ranking', () => {
  const slash = getRankingRequest({ type: 2, data: { options: [{ name: 'categoria', value: 'movie' }] } })
  assert.deepEqual(slash, { category: 'movie', page: 1 })

  const button = getRankingRequest({ type: 3, data: { custom_id: 'ranking:anime:4' } })
  assert.deepEqual(button, { category: 'anime', page: 4 })

  assert.equal(getRankingRequest({ type: 3, data: { custom_id: 'titles:all:2' } }), null)
})

test('lista los comandos en la ayuda e incluye la nota de Render', () => {
  const response = buildHelpResponse()
  const embed = response.embeds[0]

  assert.match(embed.description, /\/sugerir/)
  assert.match(embed.description, /\/ranking/)
  assert.ok(embed.fields.some((field) => /Render/.test(field.value)))
})

test('construye una respuesta de calificación con comentario', () => {
  const response = buildRatingResponse({
    media: { title: 'Bocchi the Rock!', category: 'anime' },
    rating: { score: 9, comment: 'Muy divertida *y* musical' },
    averageScore: 8.75,
    ratingCount: 4,
    updated: true,
  })
  const embed = response.embeds[0]

  assert.match(embed.title, /actualizada/)
  assert.match(embed.description, /Bocchi the Rock!/)
  assert.ok(embed.fields.some((field) => field.name === 'Nota' && field.value.includes('9/10')))
  assert.ok(embed.fields.some((field) => field.name === 'Promedio' && field.value.includes('8.8/10')))
  assert.ok(embed.fields.some((field) => field.name === 'Comentario' && field.value.includes('\\*y\\*')))
})

test('autocompleta títulos con categoría y límite de Discord', () => {
  const titles = Array.from({ length: 30 }, (_, index) => ({
    id: `id-${index}`,
    title: 'Título muy largo '.repeat(10),
    category: 'movie',
  }))
  const response = buildAutocompleteResponse(titles)

  assert.equal(response.type, 8)
  assert.equal(response.data.choices.length, 25)
  assert.ok(response.data.choices[0].name.endsWith('· Película'))
  assert.ok(response.data.choices[0].name.length <= 100)
  assert.equal(response.data.choices[0].value, 'id-0')
})
