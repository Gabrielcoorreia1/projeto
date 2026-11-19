'use client'

import { useEffect, useState } from 'react'
import * as auth from '../services/auth'
import * as projetosService from '../services/projetos'
import * as tarefasService from '../services/tarefas'

export default function Home() {
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    auth.pegarSessao()
      .then(setSession)
      .finally(() => setCarregando(false))
    return auth.escutarSessao(setSession)
  }, [])

  return (
    <main>
      <h1>📋 Minhas Tarefas</h1>
      <p className="sub">Next.js + Supabase</p>

      {carregando && <p className="msg">Carregando...</p>}
      {!carregando && (session ? <Painel user={session.user} /> : <Login />)}
    </main>
  )
}

function Login() {
  const [criando, setCriando] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (!criando) return await auth.entrar(email, senha)
      const session = await auth.cadastrar(email, senha)
      if (!session) setMsg('Conta criada! Confirme pelo link enviado ao seu e-mail.')
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <div className="card">
      <form onSubmit={enviar} className="coluna">
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres)"
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button>{criando ? 'Criar conta' : 'Entrar'}</button>
      </form>
      {msg && <p className="msg">{msg}</p>}
      <button type="button" className="link" onClick={() => setCriando(!criando)}>
        {criando ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
      </button>
    </div>
  )
}

function Painel({ user }) {
  const [projetos, setProjetos] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [novoProjeto, setNovoProjeto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([projetosService.listar(), tarefasService.listar()])
      .then(([pr, t]) => {
        setProjetos(pr)
        setTarefas(t)
      })
      .catch((err) => setErro(err.message))
  }, [user.id])

  async function adicionarProjeto(e) {
    e.preventDefault()
    const nome = novoProjeto.trim()
    if (!nome) return
    try {
      const projeto = await projetosService.criar({ nome })
      setProjetos([...projetos, projeto])
      setNovoProjeto('')
    } catch (err) {
      setErro(err.message)
    }
  }

  async function adicionar(e) {
    e.preventDefault()
    const texto = titulo.trim()
    if (!texto) return
    try {
      const tarefa = await tarefasService.criar({ titulo: texto, projeto_id: projetoId || null })
      setTarefas([...tarefas, tarefa])
      setTitulo('')
    } catch (err) {
      setErro(err.message)
    }
  }

  async function alternar(t) {
    try {
      await tarefasService.atualizar(t.id, { concluida: !t.concluida })
      setTarefas(tarefas.map((x) => (x.id === t.id ? { ...x, concluida: !x.concluida } : x)))
    } catch (err) {
      setErro(err.message)
    }
  }

  async function apagar(t) {
    if (!confirm(`Apagar "${t.titulo}"?`)) return
    try {
      await tarefasService.deletar(t.id)
      setTarefas(tarefas.filter((x) => x.id !== t.id))
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <>
      <div className="topo">
        <span>Olá, {user.email}</span>
        <button type="button" className="link" onClick={() => auth.sair().catch((err) => setErro(err.message))}>
          Sair
        </button>
      </div>

      <div className="card">
        <form onSubmit={adicionarProjeto}>
          <input
            type="text"
            placeholder="Novo projeto..."
            value={novoProjeto}
            onChange={(e) => setNovoProjeto(e.target.value)}
          />
          <button disabled={!novoProjeto.trim()}>Criar projeto</button>
        </form>

        <form onSubmit={adicionar}>
          <input type="text" placeholder="Nova tarefa..." value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)}>
            <option value="">Sem projeto</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <button disabled={!titulo.trim()}>Adicionar</button>
        </form>

        {erro && <p className="msg erro-txt">Erro: {erro}</p>}
        {!erro && tarefas.length === 0 && <p className="msg">Nenhuma tarefa ainda.</p>}

        <ul>
          {tarefas.map((t) => (
            <li key={t.id} className={t.concluida ? 'feita' : ''}>
              <label>
                <input type="checkbox" checked={t.concluida} onChange={() => alternar(t)} />
                <span>{t.titulo}</span>
                {t.projetos && <small className="tag">{t.projetos.nome}</small>}
              </label>
              <button type="button" className="apagar" onClick={() => apagar(t)} aria-label={`Apagar ${t.titulo}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
