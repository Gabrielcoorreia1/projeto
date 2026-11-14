import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const envOk = Boolean(url && key)

// null quando faltam variáveis: a página mostra o aviso em vez de quebrar
export const supabase = envOk ? createClient(url, key) : null
