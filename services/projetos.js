import { api } from '../utils/supabase'

// READ (todos) - o banco já devolve só os do usuário logado
export async function listar() {
  const { data, error } = await api.from('projetos').select('*').order('nome')
  if (error) throw error
  return data
}

// CREATE - o user_id é preenchido pelo banco
export async function criar(projeto) {
  const { data, error } = await api.from('projetos').insert(projeto).select().single()
  if (error) throw error
  return data
}
