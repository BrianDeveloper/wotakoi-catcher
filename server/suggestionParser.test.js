import test from 'node:test'
import assert from 'node:assert/strict'
import { extractSuggestionEntries } from './suggestionParser.js'

test('extracts one title per line and strips supported list formatting', () => {
  const entries = extractSuggestionEntries([
    {
      id: '100',
      timestamp: '2026-11-07T10:00:00.000Z',
      content: [
        '# Sugerencias',
        '- **Frieren: Beyond Journey’s End**',
        '2. Dungeon Meshi',
        '> [Mob Psycho 100](https://example.test)',
        'Categoría: Anime',
        '! comentario ignorado',
      ].join('\n'),
    },
  ])

  assert.deepEqual(entries.entries.map((entry) => entry.title), [
    'Frieren: Beyond Journey’s End',
    'Dungeon Meshi',
    'Mob Psycho 100',
  ])
  assert.equal(entries.entries[0].id, '100-frieren-beyond-journey-s-end')
  assert.equal(entries.entries[0].createdAt, '2026-11-07T10:00:00.000Z')
  assert.equal(entries.ignored.length, 3)
  assert.match(entries.ignored[0].reason, /encabezado/)
})

test('deduplicates equivalent titles across messages', () => {
  const entries = extractSuggestionEntries([
    { id: '100', content: '- Café Society' },
    { id: '101', content: 'Cafe Society' },
  ])

  assert.equal(entries.entries.length, 1)
  assert.match(entries.ignored[0].reason, /duplicado/)
})
