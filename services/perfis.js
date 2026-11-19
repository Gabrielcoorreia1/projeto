import { api } from '../utils/supabase'

// READ (um)
export async function buscar(id) {
  const { data, error } = await api.from('perfis').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
