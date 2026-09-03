import { isBlacklisted } from './blacklist.js'

const KITSU_API = 'https://kitsu.io/api/edge'

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

async function fetchGenres(animeId) {
  try {
    const res = await fetch(`${KITSU_API}/anime/${animeId}/genres`, {
      headers: { Accept: 'application/vnd.api+json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map((g) => g.attributes?.name).filter(Boolean)
  } catch {
    return []
  }
}

async function mapKitsu(entry, title) {
  const attrs = entry.attributes || {}
  const genres = await fetchGenres(entry.id)
  const poster = attrs.posterImage || {}
  const visibleGenres = genres.slice(0, 2)
  const hasMoreGenres = genres.length > 2
  return {
    title: attrs.canonicalTitle || attrs.titles?.en || title,
    genre: genres.length
      ? (visibleGenres.join(' / ') + (hasMoreGenres ? ' +' + (genres.length - 2) : ''))
      : 'Sin género',
    allGenres: genres.join(' / '),
    image: poster.original || poster.large || poster.medium || '',
    synopsis: attrs.synopsis ? attrs.synopsis.replace(/\s+/g, ' ').trim() : 'Sin synopsis disponible.',
    capsuleColor: hashColor(title),
  }
}

export async function getAnimeMeta(title, attempt = 1, maxRetries = 5) {
  const url = `${KITSU_API}/anime?filter[text]=${encodeURIComponent(title)}&limit=1`

  let res
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/vnd.api+json' },
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    if (attempt <= maxRetries) {
      const wait = Math.min(1000 * attempt, 8000)
      console.warn(`Reintentando "${title}" por error de red (${attempt}/${maxRetries}) en ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
      return getAnimeMeta(title, attempt + 1, maxRetries)
    }
    throw new Error(`Kitsu network error: ${err.message}`)
  }

  if (!res.ok) {
    if (res.status === 404) {
      console.warn(`"${title}" no es un anime en Kitsu; se omite.`)
      return null
    }
    if (attempt <= maxRetries) {
      const wait = Math.min(1000 * attempt, 8000)
      console.warn(`Reintentando "${title}" (HTTP ${res.status}, ${attempt}/${maxRetries}) en ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
      return getAnimeMeta(title, attempt + 1, maxRetries)
    }
    throw new Error(`Kitsu API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const entry = data?.data?.[0]

  if (!entry) {
    console.warn(`"${title}" no se encontró como anime en Kitsu; se omite.`)
    return null
  }

  return mapKitsu(entry, title)
}

const CONCURRENCY = 5

export async function getAnimesMeta(titles) {
  const results = []
  const discarded = []
  let index = 0

  const worker = async () => {
    while (index < titles.length) {
      const current = index++
      const title = titles[current]
      if (isBlacklisted(title)) {
        console.warn(`"${title}" está en la lista negra; se omite.`)
        discarded.push(title)
        continue
      }
      try {
        const anime = await getAnimeMeta(title)
        if (anime) results.push(anime)
        else discarded.push(title)
      } catch (err) {
        console.warn(`Fallo al buscar "${title}":`, err.message)
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, titles.length) }, () => worker())
  await Promise.all(workers)

  return { animes: results, discarded }
}
