import React, { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { db } from '../db/dal'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const login = useAuthStore(s=>s.login)
  const [username,setU]=useState('admin')
  const [password,setP]=useState('123')
  const [msg,setMsg]=useState('')
  const navigate = useNavigate()

  async function onSubmit(e:React.FormEvent){
    e.preventDefault()
    try {
      await db.ensureReady()
      const ok = await login(username, password)
      if(!ok) setMsg('Credenciais inválidas.')
      else navigate('/', { replace: true })
    } catch (err:any) {
      setMsg(err?.message || 'Falha ao inicializar o banco de dados.')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Acessar</h1>
        <div className="mb-3">
          <label className="label">Usuário</label>
          <input className="input" value={username} onChange={e=>setU(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="label">Senha</label>
          <input type="password" className="input" value={password} onChange={e=>setP(e.target.value)} />
        </div>
        {msg && <div className="text-red-400 text-sm mb-3">{msg}</div>}
        <button className="btn w-full" type="submit">Entrar</button>
        <p className="text-xs text-gray-400 mt-4">Dados locais no seu navegador. Offline-first.</p>
      </form>
    </div>
  )
}
