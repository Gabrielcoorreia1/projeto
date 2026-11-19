import { api } from '../utils/supabase'

export async function pegarSessao() {
  const { data, error } = await api.auth.getSession()
  if (error) throw error
  return data.session
}

export function escutarSessao(callback) {
  const { data } = api.auth.onAuthStateChange((_evento, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function entrar(email, senha) {
  const { error } = await api.auth.signInWithPassword({ email, password: senha })
  if (error) throw error
}

export async function cadastrar(nome, email, senha) {
  const { data, error } = await api.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  })
  if (error) throw error
  return data.session
}

export async function sair() {
  const { error } = await api.auth.signOut()
  if (error) throw error
}