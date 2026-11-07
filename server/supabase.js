import { createClient } from '@supabase/supabase-js'
import config from './config.js'
import { randomizeActiveAssignments } from './randomizeTitles.js'

let supabase = null
let settingsSupabase = null

if (config.supabaseUrl && config.supabaseAnonKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
} else {
  console.warn('[supabase] Faltan SUPABASE_URL o SUPABASE_ANON_KEY; la persistencia no estará disponible.')
}

if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  settingsSupabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const TABLE = 'media_items'
const SETTINGS_TABLE = 'app_settings'

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
  if (!supabase) return { added: 0, error: new Error('Supabase no está configurado') }
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
  const { data: existing, error: existingError } = await supabase.from(TABLE).select('id').in('id', ids)
  if (existingError) return { added: 0, error: existingError }
  const existingIds = new Set((existing || []).map((e) => e.id))
  const newRows = rows.filter((r) => !existingIds.has(r.id))

  if (!newRows.length) return { added: 0 }

  const { error } = await supabase.from(TABLE).insert(newRows)
  return { added: newRows.length, error }
}

export async function hasMediaItems() {
  if (!supabase) return { data: null, error: new Error('Supabase no está configurado') }
  const { data, error } = await supabase.from(TABLE).select('id').limit(1)
  return { data: Boolean(data?.length), error }
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

export async function getAllTitles(category = null, limit = 500) {
  if (!supabase) return { data: null, error: 'sin supabase' }
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  return { data: (data || []).map(mapRowToCapsule), error }
}

export async function getAllTitlesPage(category = null, page = 1, pageSize = 20) {
  if (!supabase) return { data: null, error: 'sin supabase', count: 0 }

  const offset = (page - 1) * pageSize
  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (category) query = query.eq('category', category)

  const { data, error, count } = await query
  return { data: (data || []).map(mapRowToCapsule), error, count: count || 0 }
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
      title: meta.title || undefined,
      image: meta.image || null,
      synopsis: meta.synopsis || null,
      genre: meta.genre || null,
      all_genres: meta.allGenres || null,
      capsule_color: meta.capsuleColor || null,
    })
    .eq('id', id)
  return { data, error }
}

export async function backfillCategories(items) {
  if (!supabase) return { error: new Error('Supabase no está configurado') }
  if (!items.length) return { error: null }

  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select('id, category')
    .in('id', items.map((item) => item.id))
  if (selectError) return { error: selectError }

  const categoryById = new Map(items.map((item) => [item.id, item.category]))
  const missingByCategory = new Map()
  for (const row of existing || []) {
    if (row.category) continue
    const category = categoryById.get(row.id)
    if (!category) continue
    const ids = missingByCategory.get(category) || []
    ids.push(row.id)
    missingByCategory.set(category, ids)
  }

  for (const [category, ids] of missingByCategory) {
    const { error } = await supabase
      .from(TABLE)
      .update({ category })
      .in('id', ids)
    if (error) return { error }
  }
  return { error: null }
}

export async function getAppSetting(key) {
  if (!settingsSupabase) {
    return { data: null, error: new Error('Falta SUPABASE_SERVICE_ROLE_KEY en server/.env') }
  }
  const { data, error } = await settingsSupabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return { data: data?.value ?? null, error }
}

export async function setAppSetting(key, value) {
  if (!settingsSupabase) {
    return { error: new Error('Falta SUPABASE_SERVICE_ROLE_KEY en server/.env') }
  }
  const { error } = await settingsSupabase
    .from(SETTINGS_TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  return { error }
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

export async function deleteMediaById(id) {
  if (!supabase) return { data: null, error: new Error('Supabase no está configurado') }
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()
  return { data, error }
}

export async function updateTitleCorrection(id, category, meta = null) {
  if (!supabase) return { data: null, error: new Error('Supabase no está configurado') }
  const updates = { category }
  if (meta) {
    Object.assign(updates, {
      title: meta.title,
      image: meta.image || null,
      synopsis: meta.synopsis || null,
      genre: meta.genre || null,
      all_genres: meta.allGenres || null,
      capsule_color: meta.capsuleColor || null,
    })
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  return { data, error }
}

export async function reshuffleActiveTitles(capacity = 30) {
  if (!supabase) return { data: null, error: new Error('Supabase no está configurado') }

  const activeItems = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, category')
      .in('status', ['PENDING', 'IN_MACHINE'])
      .range(offset, offset + 999)
    if (error) return { data: null, error }
    activeItems.push(...(data || []))
    if (!data || data.length < 1000) break
  }

  const assignments = randomizeActiveAssignments(activeItems, capacity)
  if (assignments.pendingIds.length) {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'PENDING' })
      .in('id', assignments.pendingIds)
    if (error) return { data: null, error }
  }
  if (assignments.machineIds.length) {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'IN_MACHINE' })
      .in('id', assignments.machineIds)
    if (error) return { data: null, error }
  }

  return {
    data: {
      selected: assignments.machineIds.length,
      pending: assignments.pendingIds.length,
    },
    error: null,
  }
}

export async function resetAll() {
  if (!supabase) return { error: 'sin supabase' }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'PENDING' })
    .neq('status', 'PENDING')
  return { data, error }
}
