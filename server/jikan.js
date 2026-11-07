import 'dotenv/config'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER_IMG = 'https://via.placeholder.com/500x750?text=Sin+Imagen'
export const TMDB_LANGUAGE = 'es-MX'
const TMDB_KEY = process.env.TMDB_API_KEY || ''
const GENRE_ANIMATION = 16
const MATCH_THRESHOLD = 0.5

const GENRE_MAP = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción',
  10770: 'Película de TV', 53: 'Suspense', 10752: 'Bélica',
  37: 'Western', 10759: 'Acción & Aventura', 10762: 'Infantil',
  10763: 'Noticias', 10764: 'Reality', 10765: 'Sci-Fi & Fantasía',
  10766: 'Soap', 10767: 'Talk', 10768: 'Guerra & Política',
}

const FALLBACK_COLORS = [
  '#f43f5e', '#f59e0b', '#3b82f6', '#ec4899',
  '#8b5cf6', '#06b6d4', '#10b981', '#f97316',
]

function hashColor(title) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

function getDisplayTitle(item) {
  return item.title || item.name || ''
}

// Anime: serie japonesa o película que continúa una historia de anime.
// Como TMDB no tiene un flag de "anime", usamos el género Animación (16)
// como señal: cualquier TV o movie con ese género se clasifica como anime.
function deriveCategory(item) {
  const isAnime = (item.genre_ids || []).includes(GENRE_ANIMATION)
  const type = item.media_type
  if (isAnime) return 'anime'
  if (type === 'movie') return 'movie'
  return 'series'
}

function posterUrl(path) {
  return path ? `${TMDB_IMG}${path}` : PLACEHOLDER_IMG
}

// Palabras de relleno en varios idiomas que no aportan para distinguir obras
const STOPWORDS = new Set([
  'the', 'of', 'and', 'a', 'an', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'is',
  'el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'e', 'u', 'en', 'para', 'por', 'con', 'un', 'una', 'unos', 'unas', 'al', 'a',
  'no', 'na', 'ni', 'su', 'sus', 'mi', 'tu', 'es', 'se', 'el', 'al',
  'ou', 'et', 'du', 'des', 'au', 'aux', 'le', 'la', 'les',
])

// Normaliza un título para comparar: minúsculas, sin acentos, sin signos/puntuación
function normalizeCompare(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extrae los tokens "distintivos" (palabras largas que no son stopwords)
function distinctiveTokens(str) {
  return normalizeCompare(str)
    .split(' ')
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

// ¿Difieren dos strings en 0 o 1 carácter? Tolera variaciones ortográficas comunes
// en títulos traducidos/romaji (ej. "carte" ≈ "karte", "seraph" ≈ "serafin" términos largos).
function nearEqual(a, b) {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let edits = 0
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] !== b[j]) {
      edits++
      if (edits > 1) return false
      if (a.length > b.length) i++
      else if (b.length > a.length) j++
      else { i++; j++ }
    } else {
      i++
      j++
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

// Puntúa cuán bien coincide un resultado con el término buscado (0-1).
// Se centra en tokens distintivos para tolerar traducciones/romaji que
// comparten solo una palabra clave (ej. "Owari no seraph" → "Seraph of the end").
function titleScore(normQuery, resultTitle) {
  if (!normQuery || !resultTitle) return 0
  const normResult = normalizeCompare(resultTitle)
  if (!normResult) return 0

  // Coincidencia exacta
  if (normResult === normQuery) return 1

  const queryTokens = distinctiveTokens(normQuery)
  const resultTokens = distinctiveTokens(normResult)

  if (queryTokens.length === 0 || resultTokens.length === 0) {
    // Sin tokens distintivos, cae a coincidencia por contención
    if (normResult.includes(normQuery)) return 0.85
    if (normQuery.includes(normResult) && normResult.length >= 4) return 0.75
    return 0
  }

  let matched = 0
  for (const w of queryTokens) {
    if (resultTokens.some((rw) => nearEqual(w, rw))) matched++
  }

  // Fracción de tokens del query que coinciden
  const ratio = matched / queryTokens.length

  // Si el resultado cubre el query o el query cubre al resultado (sub-título)
  const containedInResult = normResult.includes(normQuery) && normQuery.length >= 4
  const queryContainsResult = normQuery.includes(normResult) && normResult.length >= 4

  if (containedInResult) return Math.max(ratio, 0.85)
  if (queryContainsResult) return Math.max(ratio, 0.75)

  return ratio
}

function mapGenres(genreIds) {
  return (genreIds || [])
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
}

async function searchOneLanguage(query, language) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language,
    query,
  })
  const url = `${TMDB_BASE}/search/multi?${params}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.results || [])
    .filter((r) => r && (r.media_type === 'tv' || r.media_type === 'movie'))
}

async function searchTMDB(query, attempt = 1, maxRetries = 5) {
  if (!TMDB_KEY) {
    throw new Error('TMDB_API_KEY no está configurada en server/.env')
  }
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: TMDB_LANGUAGE,
    query,
  })
  const url = `${TMDB_BASE}/search/multi?${params}`

  let res
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  } catch (err) {
    if (attempt <= maxRetries) {
      const wait = Math.min(1000 * attempt, 8000)
      console.warn(`[tmdb] reintento "${query}" por error de red (${attempt}/${maxRetries}) en ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
      return searchTMDB(query, attempt + 1, maxRetries)
    }
    throw new Error(`TMDB network error: ${err.message}`)
  }

  if (!res.ok) {
    if (res.status === 404) {
      return { item: null, score: 0, bestMatch: null }
    }
    if (attempt <= maxRetries) {
      const wait = Math.min(1000 * attempt, 8000)
      console.warn(`[tmdb] reintento "${query}" (HTTP ${res.status}, ${attempt}/${maxRetries}) en ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
      return searchTMDB(query, attempt + 1, maxRetries)
    }
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  let results = (data?.results || [])
    .filter((r) => r && (r.media_type === 'tv' || r.media_type === 'movie'))

  const normQuery = normalizeCompare(query)
  const STRONG = 0.8

  // Search in Mexican Spanish first so TMDB returns its localized display title.
  const initialBest = pickBest(normQuery, results)
  let best = initialBest

  // Search other locales only to identify the work; display metadata stays es-MX.
  if (best.score < STRONG) {
    const langs = ['es-ES', 'en-US', 'ja-JP']
    const fetched = await Promise.allSettled(
      langs.map((lang) => searchOneLanguage(query, lang)),
    )
    for (const r of fetched) {
      if (r.status === 'fulfilled') results.push(...r.value)
    }
    best = pickBest(normQuery, results)
  }

  return {
    item: best.item && best.score >= MATCH_THRESHOLD ? best.item : null,
    score: best.score,
    bestMatch: best.item ? getDisplayTitle(best.item) : null,
  }
}

export function selectMexicanSpanishMetadata(item, localizedDetails) {
  const translation = localizedDetails?.translations?.translations?.find(
    (entry) => entry.iso_3166_1 === 'MX'
      && entry.iso_639_1 === 'es'
      && (entry.data?.title || entry.data?.name),
  )
  const title = localizedDetails?.title
    || localizedDetails?.name
    || translation?.data?.title
    || translation?.data?.name
    || item.title
    || item.name
    || item.original_title
    || item.original_name
    || ''

  return {
    title,
    synopsis: localizedDetails?.overview || '',
  }
}

async function fetchMexicanSpanishMetadata(item) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: TMDB_LANGUAGE,
    append_to_response: 'translations',
  })
  const response = await fetch(
    `${TMDB_BASE}/${item.media_type}/${item.id}?${params}`,
    { signal: AbortSignal.timeout(15000) },
  )
  if (!response.ok) {
    throw new Error(`TMDB details error: ${response.status} ${response.statusText}`)
  }
  return selectMexicanSpanishMetadata(item, await response.json())
}

export function explainMatchRejection(title, match) {
  const score = Number(match.score.toFixed(2))
  if (!match.bestMatch) {
    return {
      title,
      reason: 'TMDB no devolvió resultados en los idiomas consultados.',
      bestMatch: null,
      score,
      threshold: MATCH_THRESHOLD,
    }
  }
  return {
    title,
    reason: `La mejor coincidencia quedó por debajo del mínimo requerido (${MATCH_THRESHOLD.toFixed(2)}).`,
    bestMatch: match.bestMatch,
    score,
    threshold: MATCH_THRESHOLD,
  }
}

// Agrupa resultados por id, fusiona variantes de título y puntúa contra el query
function pickBest(normQuery, rawResults) {
  const grouped = new Map()
  for (const r of rawResults) {
    const key = `${r.media_type}:${r.id}`
    if (!grouped.has(key)) grouped.set(key, { ...r, titles: [] })
    const g = grouped.get(key)
    for (const t of [r.title, r.name, r.original_title, r.original_name]) {
      if (t) g.titles.push(t)
    }
  }

  let bestItem = null
  let bestScore = 0
  for (const g of grouped.values()) {
    let score = 0
    for (const c of g.titles) {
      score = Math.max(score, titleScore(normQuery, c))
    }
    // Prioridad: TV antes que movie (las series/anime suelen ser TV)
    const priority = g.media_type === 'tv' ? 1.05 : 1.0
    const total = score * priority
    if (total > bestScore) {
      bestScore = total
      bestItem = g
    }
  }

  return { item: bestItem, score: bestScore }
}

async function getAnimeMeta(entry, attempt = 1, maxRetries = 5, categoryOverride) {
  const title = typeof entry === 'string' ? entry : entry.title
  const entryId = typeof entry === 'object' ? entry.id : undefined
  const createdAt = typeof entry === 'object' ? entry.createdAt : undefined
  const override = categoryOverride || (typeof entry === 'object' ? entry.category : undefined)
  const match = await searchTMDB(title, attempt, maxRetries)
  if (!match.item) return { anime: null, rejection: explainMatchRejection(title, match) }
  const item = match.item
  const localized = await fetchMexicanSpanishMetadata(item)

  const genres = mapGenres(item.genre_ids)
  const visibleGenres = genres.slice(0, 2)
  const hasMoreGenres = genres.length > 2

  const synopsis = localized.synopsis.replace(/\s+/g, ' ').trim() || 'Sinopsis no disponible.'

  return {
    anime: {
      id: entryId || hashId(title),
      title: localized.title || getDisplayTitle(item),
      genre: genres.length
        ? (visibleGenres.join(' / ') + (hasMoreGenres ? ' +' + (genres.length - 2) : ''))
        : 'Sin género',
      allGenres: genres.join(' / '),
      image: posterUrl(item.poster_path),
      synopsis,
      capsuleColor: hashColor(title),
      category: override || deriveCategory(item),
      createdAt: createdAt || null,
    },
    rejection: null,
  }
}

// Enriquecer una sugerencia guardada: prioriza la categoría elegida por el usuario
export async function getSuggestionMeta(title, category) {
  const result = await getAnimeMeta({ title }, 1, 5, category)
  return result.anime
}

function hashId(title) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0
  return 'auto-' + Math.abs(h)
}

const CONCURRENCY = 5

export async function getAnimesMeta(titles) {
  const results = []
  const discarded = []
  const failed = []
  let index = 0

  const worker = async () => {
    while (index < titles.length) {
      const current = index++
      const entry = titles[current]
      const displayTitle = typeof entry === 'string' ? entry : entry.title
      try {
        const { anime, rejection } = await getAnimeMeta(entry)
        if (anime) results.push(anime)
        else discarded.push(rejection || {
          title: displayTitle,
          reason: 'TMDB no aceptó el resultado por un motivo no especificado.',
          bestMatch: null,
          score: 0,
          threshold: MATCH_THRESHOLD,
        })
      } catch (err) {
        console.warn(`[tmdb] fallo al buscar "${displayTitle}":`, err.message)
        failed.push({ title: displayTitle, reason: err.message })
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, titles.length) }, () => worker())
  await Promise.all(workers)

  return { animes: results, discarded, failed }
}
