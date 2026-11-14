import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAutocompleteResponse,
  buildRankingResponse,
  buildRatingResponse,
} from './discordRatings.js'

test('construye un podio con medallas y el resto numerado', () => {
  const response = buildRankingResponse({
    titles: [
      { title: 'Uno', category: 'anime', averageScore: 9.5, ratingCount: 4 },
      { title: 'Dos', category: 'series', averageScore: 9, ratingCount: 3 },
      { title: 'Tres', category: 'movie', averageScore: 8.5, ratingCount: 2 },
      { title: 'Cuatro', category: 'anime', averageScore: 8, ratingCount: 1 },
    ],
    category: 'anime',
  })

  const embed = response.embeds[0]
  assert.match(embed.title, /Anime/)
  assert.match(embed.description, /🥇 \*\*Uno\*\* — ⭐ 9\.5 · 4 votos/)
  assert.match(embed.description, /🥈 \*\*Dos\*\* — ⭐ 9\.0 · 3 votos/)
  assert.match(embed.description, /🥉 \*\*Tres\*\* — ⭐ 8\.5 · 2 votos/)
  assert.match(embed.description, /4\. \*\*Cuatro\*\* — ⭐ 8\.0 · 1 voto/)
  assert.match(embed.footer.text, /4 obras en el ranking/)
  assert.deepEqual(response.allowed_mentions.parse, [])
})

test('limita el ranking a diez obras y escapa Markdown', () => {
  const titles = Array.from({ length: 12 }, (_, index) => ({
    title: `Obra *${index + 1}*`,
    category: 'anime',
    averageScore: 10 - index / 10,
    ratingCount: 12 - index,
  }))
  const response = buildRankingResponse({ titles, category: null })
  const embed = response.embeds[0]
  const lines = embed.description.split('\n')

  assert.equal(lines.length, 10)
  assert.match(lines[0], /Obra \\\*1\\\*/)
  assert.match(lines[9], /10\. \*\*Obra \\\*10\\\*\*/)
  assert.match(embed.title, /Todas las categorías/)
})

test('muestra un estado vacío sin calificaciones', () => {
  const response = buildRankingResponse({ titles: [], category: 'series' })
  const embed = response.embeds[0]

  assert.match(embed.description, /\/calificar/)
  assert.match(embed.footer.text, /Serie · 0 obras calificadas/)
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
