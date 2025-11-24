import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'

export default function UserList(){
  const [rows,setRows]=useState<any[]>([])
  const [form,setForm]=useState<any>({ role:'atendente', password:'123456' })
  const [show,setShow]=useState(false)

  async function load(){
    await db.ensureReady()
    setRows(await dal.users.list())
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex items-center justify-between">
        <div>Gerenciamento de Usuários</div>
        <button className="btn" onClick={()=>{ setForm({ role:'atendente', password:'123456'}); setShow(true)}}>Novo Usuário</button>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead><tr><th>Usuário</th><th>Nome</th><th>Perfil</th><th>Ativo</th><th>Criado em</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.username}</td>
                <td>{r.display_name||''}</td>
                <td>{r.role}</td>
                <td>{r.active? 'Sim':'Não'}</td>
                <td>{r.created_at}</td>
                <td><button className="link" onClick={async()=>{ await dal.users.toggleActive(r.id, r.active?0:1); load() }}>{r.active?'Desativar':'Ativar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6">
          <div className="card max-w-xl w-full">
            <div className="font-semibold mb-2">Novo Usuário</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Usuário</label><input className="input" value={form.username||''} onChange={e=>setForm({...form, username:e.target.value})}/></div>
              <div><label className="label">Nome</label><input className="input" value={form.display_name||''} onChange={e=>setForm({...form, display_name:e.target.value})}/></div>
              <div><label className="label">Perfil</label>
                <select className="input" value={form.role||'atendente'} onChange={e=>setForm({...form, role:e.target.value})}>
                  <option value="admin">admin</option><option value="atendente">atendente</option><option value="mecanico">mecanico</option>
                </select>
              </div>
              <div><label className="label">Senha</label><input className="input" value={form.password||''} onChange={e=>setForm({...form, password:e.target.value})}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn" onClick={async()=>{ await dal.users.create(form); setShow(false); await load() }}>Salvar</button>
              <button className="btn" onClick={()=>setShow(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
