import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COMMENT_MAX_LENGTH,
  escapeLikePattern,
  formatAverage,
  formatVotes,
  normalizeRaterKey,
  normalizeRaterName,
  truncateText,
  validateRating,
} from './ratings.js'

test('normaliza la identidad para unir votos de Discord y web', () => {
  assert.equal(normalizeRaterKey('  @Brian   M '), 'brian m')
  assert.equal(normalizeRaterKey('BRIAN M'), 'brian m')
  assert.equal(normalizeRaterKey(''), '')
  assert.equal(normalizeRaterName('  @Brian   M '), 'Brian M')
})

test('valida y limpia una calificación correcta', () => {
  const result = validateRating({
    score: '8',
    comment: '  Muy buena  ',
    raterName: ' Brian ',
    source: 'web',
  })

  assert.equal(result.error, undefined)
  assert.deepEqual(result.value, {
    score: 8,
    comment: 'Muy buena',
    raterName: 'Brian',
    raterKey: 'brian',
    source: 'web',
  })
})

test('convierte un comentario vacío en null', () => {
  const result = validateRating({
    score: 7,
    comment: '   ',
    raterName: 'Brian',
    source: 'discord',
  })

  assert.equal(result.value.comment, null)
})

test('rechaza notas, nombres, comentarios y orígenes inválidos', () => {
  assert.match(validateRating({ score: 0, raterName: 'A', source: 'web' }).error, /entero/)
  assert.match(validateRating({ score: 10.5, raterName: 'A', source: 'web' }).error, /entero/)
  assert.match(validateRating({ score: 5, raterName: '  ', source: 'web' }).error, /nombre/)
  assert.match(
    validateRating({
      score: 5,
      raterName: 'A',
      comment: 'x'.repeat(COMMENT_MAX_LENGTH + 1),
      source: 'web',
    }).error,
    /comentario/,
  )
  assert.match(validateRating({ score: 5, raterName: 'A', source: 'otro' }).error, /origen/)
})

test('formatea promedio, votos y utilidades de texto', () => {
  assert.equal(formatAverage(8.44), '8.4')
  assert.equal(formatAverage(10), '10.0')
  assert.equal(formatAverage('sin datos'), '—')
  assert.equal(formatVotes(1), '1 voto')
  assert.equal(formatVotes(3), '3 votos')
  assert.equal(formatVotes(null), '0 votos')
  assert.equal(escapeLikePattern('100%_real'), '100\\%\\_real')
  assert.equal(truncateText('abcdefgh', 5), 'abcd…')
  assert.equal(truncateText('abc', 5), 'abc')
})
