import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.join(__dirname, 'cache.json')

let cache = []
let discarded = []
let lastUpdated = null

function persist() {
  try {
    const payload = {
      lastUpdated: lastUpdated?.toISOString() ?? null,
      animes: cache,
      discarded,
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2))
  } catch (err) {
    console.error('[cache] no se pudo persistir:', err.message)
  }
}

export function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return
    const payload = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    cache = Array.isArray(payload.animes) ? payload.animes : []
    discarded = Array.isArray(payload.discarded) ? payload.discarded : []
    lastUpdated = payload.lastUpdated ? new Date(payload.lastUpdated) : null
    console.log(`[cache] cargados ${cache.length} animes y ${discarded.length} descartados desde disco`)
  } catch (err) {
    console.error('[cache] error al cargar:', err.message)
  }
}

export function setAnimes(list) {
  cache = list
  lastUpdated = new Date()
  persist()
}

export function addDiscarded(titles) {
  const norm = discarded.map((d) => d.toLowerCase().trim())
  const newly = (Array.isArray(titles) ? titles : [titles]).filter(
    (t) => !norm.includes(String(t).toLowerCase().trim())
  )
  if (newly.length > 0) {
    discarded = [...discarded, ...newly]
    persist()
  }
}

export function getDiscarded() {
  return discarded
}

export function getAnimes() {
  return cache
}

export function getLastUpdated() {
  return lastUpdated
}
