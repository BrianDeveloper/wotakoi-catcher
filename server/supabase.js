import { createClient } from '@supabase/supabase-js'
import config from './config.js'

let supabase = null

if (config.supabaseUrl && config.supabaseAnonKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
} else {
  console.warn('[supabase] Faltan SUPABASE_URL o SUPABASE_ANON_KEY; la persistencia no estará disponible.')
}

const TABLE = 'media_items'

function mapRowToCapsule(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    genre: row.genre,
    allGenres: row.all_genres,
    image: row.image,
    synopsis: row.synopsis,
    capsuleColor: row.capsule_color,
    category: row.category,
    suggested_by: row.suggested_by,
    createdAt: row.created_at,
    consumedAt: row.consumed_at,
  }
}

export async function upsertMedia(items) {
  if (!supabase) return { added: 0 }
  const rows = items.map((it) => ({
    id: it.id,
    title: it.title,
    status: it.status || 'PENDING',
    image: it.image || null,
    synopsis: it.synopsis || null,
    genre: it.genre || null,
    all_genres: it.allGenres || null,
    capsule_color: it.capsuleColor || null,
    category: it.category || null,
    created_at: it.createdAt || null,
  }))

  // Verificar IDs existentes
  const ids = rows.map((r) => r.id)
  const { data: existing } = await supabase.from(TABLE).select('id').in('id', ids)
  const existingIds = new Set((existing || []).map((e) => e.id))
  const newRows = rows.filter((r) => !existingIds.has(r.id))

  if (!newRows.length) return { added: 0 }

  const { error } = await supabase.from(TABLE).insert(newRows)
  return { added: newRows.length, error }
}

export async function getByStatus(...statuses) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const flat = statuses.flat()
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: true })
  if (flat.length === 1) {
    query = query.eq('status', flat[0])
  } else {
    query = query.in('status', flat)
  }
  const { data, error } = await query
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function getPendingOldest(limit = 30) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
    .limit(limit)
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function getByStatusCategory(status, category) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', status)
    .eq('category', category)
    .order('created_at', { ascending: true })
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function getPendingOldestByCategory(limit = 30, category) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'PENDING')
    .eq('category', category)
    .order('created_at', { ascending: true })
    .limit(limit)
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function insertSuggestion({ id, title, category, suggestedBy }) {
  if (!supabase) return { error: 'sin supabase' }
  const { data, error } = await supabase.from(TABLE).insert({
    id,
    title,
    category,
    suggested_by: suggestedBy || null,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  })
  return { data, error }
}

export async function updateMeta(id, meta) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      image: meta.image || null,
      synopsis: meta.synopsis || null,
      genre: meta.genre || null,
      all_genres: meta.allGenres || null,
      capsule_color: meta.capsuleColor || null,
    })
    .eq('id', id)
  return { data, error }
}

export async function updateCategory(id, category) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ category })
    .eq('id', id)
  return { data, error }
}

export async function setStatus(ids, status) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .in('id', ids)
  return { data, error }
}

export async function setConsumed(ids, consumedAt = new Date().toISOString()) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'WATCHED', consumed_at: consumedAt })
    .in('id', ids)
  return { data, error }
}

export async function getConsumedHistory(limit = 100) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'WATCHED')
    .not('consumed_at', 'is', null)
    .order('consumed_at', { ascending: false })
    .limit(limit)
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function getById(id) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  return { data: data ? mapRowToCapsule(data) : null, error }
}

export async function resetAll() {
  if (!supabase) return { error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'PENDING' })
    .neq('status', 'PENDING')
  return { data, error }
}
