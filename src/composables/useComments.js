import { ref, watch } from 'vue'
import { supabase } from '../../supabase/supabase.js'

const STORAGE_KEY = 'cryptodash-comments'
const cache = ref({})

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) Object.assign(cache.value, JSON.parse(raw))
  } catch {
    /* keep defaults */
  }
}

function saveCache() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.value))
}

loadCache()

export async function getCommentCount(articleId) {
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("article_id", Number(articleId));

  if (error) {
    console.warn("[comments] count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getComments(articleId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', Number(articleId))
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[comments] load failed:', error.message)
    return []
  }

  const list = (data || []).map((row) => ({
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    userName: row.user_name,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const key = String(articleId)
  cache.value[key] = list
  saveCache()
  return list
}

export async function postComment(articleId, text, currentUser) {
  if (!currentUser) return null

  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: Number(articleId),
      user_id: currentUser.id,
      user_name: currentUser.name || currentUser.email || 'User',
      text: text.trim(),
    })
    .select()
    .single()

  if (error) {
    console.warn('[comments] insert failed:', error.message)
    return null
  }

  const key = String(articleId)
  const comment = {
    id: data.id,
    articleId: data.article_id,
    userId: data.user_id,
    userName: data.user_name,
    text: data.text,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  cache.value[key] = [...(cache.value[key] || []), comment]
  saveCache()
  return comment
}

export async function removeComment(commentId, currentUser) {
  if (!currentUser) return false

  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', currentUser.id)
    .select()

  if (error) {
    console.warn('[comments] delete failed:', error.message)
    return false
  }

  for (const key of Object.keys(cache.value)) {
    cache.value[key] = cache.value[key].filter((c) => c.id !== commentId)
  }
  saveCache()
  return true
}

export async function updateComment(commentId, text, currentUser) {
  if (!currentUser) return null

  const { data, error } = await supabase
    .from('comments')
    .update({ text: text.trim() })
    .eq('id', commentId)
    .eq('user_id', currentUser.id)
    .select()
    .single()

  if (error) {
    console.warn('[comments] update failed:', error.message)
    return null
  }

  for (const key of Object.keys(cache.value)) {
    const idx = cache.value[key].findIndex((c) => c.id === commentId)
    if (idx !== -1) {
      cache.value[key][idx] = {
        ...cache.value[key][idx],
        text: data.text,
        updatedAt: data.updated_at,
      }
    }
  }
  saveCache()
  return {
    id: data.id,
    text: data.text,
    updatedAt: data.updated_at,
  }
}
