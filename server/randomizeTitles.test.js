import test from 'node:test'
import assert from 'node:assert/strict'
import { randomizeActiveAssignments } from './randomizeTitles.js'

test('selects up to the machine capacity per category and leaves the rest pending', () => {
  const items = [
    ...Array.from({ length: 32 }, (_, index) => ({ id: `anime-${index}`, category: 'anime' })),
    ...Array.from({ length: 4 }, (_, index) => ({ id: `movie-${index}`, category: 'movie' })),
    ...Array.from({ length: 35 }, (_, index) => ({ id: `series-${index}`, category: 'series' })),
    { id: 'uncategorized', category: null },
  ]
  let randomCalls = 0
  const result = randomizeActiveAssignments(items, 30, () => {
    randomCalls++
    return 0.5
  })

  assert.equal(result.machineIds.length, 64)
  assert.equal(result.pendingIds.length, 8)
  assert.ok(randomCalls > 0)
  assert.equal(result.machineIds.filter((id) => id.startsWith('anime-')).length, 30)
  assert.equal(result.machineIds.filter((id) => id.startsWith('movie-')).length, 4)
  assert.equal(result.machineIds.filter((id) => id.startsWith('series-')).length, 30)
  assert.ok(result.pendingIds.includes('uncategorized'))
  assert.equal(new Set([...result.machineIds, ...result.pendingIds]).size, items.length)
})

test('selects every eligible title when a category has fewer titles than the capacity', () => {
  const items = [{ id: 'movie-1', category: 'movie' }]
  const result = randomizeActiveAssignments(items, 30, () => 0)

  assert.deepEqual(result.machineIds, ['movie-1'])
  assert.deepEqual(result.pendingIds, [])
})
