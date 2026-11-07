import test from 'node:test'
import assert from 'node:assert/strict'
import {
  explainMatchRejection,
  normalizeTMDBSearchQuery,
  selectMexicanSpanishMetadata,
  titleScore,
  TMDB_LANGUAGE,
} from './jikan.js'

test('uses the Mexican Spanish locale for TMDB requests', () => {
  assert.equal(TMDB_LANGUAGE, 'es-MX')
})

test('searches the primary title when a parenthetical alternate title is included', () => {
  assert.equal(normalizeTMDBSearchQuery('Get Out(Huye)'), 'Get Out')
  assert.equal(normalizeTMDBSearchQuery('Get Out (Huye)'), 'Get Out')
  assert.equal(normalizeTMDBSearchQuery('Get Out (2017)'), 'Get Out (2017)')
  assert.equal(normalizeTMDBSearchQuery('One Piece (Live Action)'), 'One Piece (Live Action)')
})

test('does not accept an unrelated title just because it matches a parenthetical alias', () => {
  const query = normalizeTMDBSearchQuery('Get Out(Huye)').toLowerCase()

  assert.equal(titleScore(query, 'Get Out'), 1)
  assert.equal(titleScore(query, 'Huye y gana'), 0)
})

test('prefers the localized es-MX detail title and synopsis', () => {
  const result = selectMexicanSpanishMetadata(
    { title: 'Search title', original_title: 'Original title' },
    {
      title: 'Título mexicano',
      overview: 'Sinopsis en español latino.',
      translations: { translations: [] },
    },
  )

  assert.deepEqual(result, {
    title: 'Título mexicano',
    synopsis: 'Sinopsis en español latino.',
  })
})

test('uses an explicit Mexico Spanish translation before search/original titles', () => {
  const result = selectMexicanSpanishMetadata(
    { title: 'English result', original_title: 'Japanese title' },
    {
      title: '',
      translations: {
        translations: [
          { iso_3166_1: 'ES', iso_639_1: 'es', data: { title: 'Título de España' } },
          { iso_3166_1: 'MX', iso_639_1: 'es', data: { title: 'Título de México' } },
        ],
      },
    },
  )

  assert.equal(result.title, 'Título de México')
})

test('explains when TMDB returned no usable candidates', () => {
  const result = explainMatchRejection('Unknown Title', {
    bestMatch: null,
    score: 0,
  })

  assert.equal(result.title, 'Unknown Title')
  assert.equal(result.reason, 'TMDB no devolvió resultados en los idiomas consultados.')
  assert.equal(result.bestMatch, null)
  assert.equal(result.score, 0)
  assert.equal(result.threshold, 0.5)
})

test('includes the best candidate and score when it misses the threshold', () => {
  const result = explainMatchRejection('One Piece', {
    bestMatch: 'One Piece Film: Red',
    score: 0.43,
  })

  assert.match(result.reason, /por debajo del mínimo/)
  assert.equal(result.bestMatch, 'One Piece Film: Red')
  assert.equal(result.score, 0.43)
  assert.equal(result.threshold, 0.5)
})
