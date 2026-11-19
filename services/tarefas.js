import { api } from '../utils/supabase'


export async function listar() {
  const { data, error } = await api.from('tarefas').select('*, projetos(nome)').order('created_at')
  if (error) throw error
  return data
}

export async function criar(tarefa) {
  const { data, error } = await api.from('tarefas').insert(tarefa).select('*, projetos(nome)').single()
  if (error) throw error
  return data
}

export async function atualizar(id, campos) {
  const { error } = await api.from('tarefas').update(campos).eq('id', id)
  if (error) throw error
}

export async function deletar(id) {
  const { error } = await api.from('tarefas').delete().eq('id', id)
  if (error) throw error
}
