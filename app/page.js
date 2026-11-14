'use client'

import { useEffect, useState } from 'react'
import { supabase, envOk } from '../utils/supabase'

export default function Home() {
  const [tarefas, setTarefas] = useState([])
  const [titulo, setTitulo] = useState('')
  const [carregando, setCarregando] = useState(envOk)
  const [erro, setErro] = useState('')

  async function carregar() {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) setErro(error.message)
    else setTarefas(data)
    setCarregando(false)
  }

  useEffect(() => {
    if (envOk) carregar()
  }, [])

  async function adicionar(e) {
    e.preventDefault()
    const texto = titulo.trim()
    if (!texto) return
    const { data, error } = await supabase
      .from('tarefas')
      .insert({ titulo: texto })
      .select()
      .single()
    if (error) return setErro(error.message)
    setTarefas([...tarefas, data])
    setTitulo('')
  }

  async function alternar(t) {
    const { error } = await supabase
      .from('tarefas')
      .update({ concluida: !t.concluida })
      .eq('id', t.id)
    if (error) return setErro(error.message)
    setTarefas(tarefas.map((x) => (x.id === t.id ? { ...x, concluida: !x.concluida } : x)))
  }

  return (
    <main>
      <h1>📋 Minhas Tarefas</h1>
      <p className="sub">Next.js + Supabase + Vercel</p>

      {envOk ? (
        <div className="status ok">
          <span className="dot" /> Conectado ao Supabase
        </div>
      ) : (
        <div className="status erro">
          <span className="dot" />
          <span>
            Variáveis faltando: <code>NEXT_PUBLIC_SUPABASE_URL</code> e/ou{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </span>
        </div>
      )}

      <div className="card">
        <form onSubmit={adicionar}>
          <input
            type="text"
            placeholder="Nova tarefa..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={!envOk}
          />
          <button disabled={!envOk || !titulo.trim()}>Adicionar</button>
        </form>

        {erro && <p className="msg erro-txt">Erro: {erro}</p>}
        {carregando && <p className="msg">Carregando...</p>}
        {!carregando && envOk && !erro && tarefas.length === 0 && (
          <p className="msg">Nenhuma tarefa ainda.</p>
        )}

        <ul>
          {tarefas.map((t) => (
            <li key={t.id} className={t.concluida ? 'feita' : ''}>
              <label>
                <input type="checkbox" checked={t.concluida} onChange={() => alternar(t)} />
                <span>{t.titulo}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
