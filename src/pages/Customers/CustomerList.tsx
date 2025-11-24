import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'

export default function CustomerList(){
  const [rows,setRows]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [form,setForm]=useState<any>({})
  const [show,setShow]=useState(false)

  async function load(){
    await db.ensureReady()
    setRows(await dal.customers.list(q))
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex gap-2 items-end">
        <div><label className="label">Buscar</label><input className="input" value={q} onChange={e=>setQ(e.target.value)}/></div>
        <button className="btn" onClick={load}>Filtrar</button>
        <div className="ml-auto"></div>
        <button className="btn" onClick={()=>{ setForm({}); setShow(true) }}>Novo Cliente</button>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead><tr><th>Nome/Razão</th><th>CPF/CNPJ</th><th>Telefone</th><th>E-mail</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.cpf_cnpj||''}</td>
                <td>{r.phone||''}</td>
                <td>{r.email||''}</td>
                <td><button className="link" onClick={()=>{ setForm(r); setShow(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6">
          <div className="card max-w-xl w-full">
            <div className="font-semibold mb-2">{form.id? 'Editar Cliente':'Novo Cliente'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Nome/Razão</label><input className="input" value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})}/></div>
              <div><label className="label">Apelido</label><input className="input" value={form.alias||''} onChange={e=>setForm({...form, alias:e.target.value})}/></div>
              <div><label className="label">CPF/CNPJ</label><input className="input" value={form.cpf_cnpj||''} onChange={e=>setForm({...form, cpf_cnpj:e.target.value})}/></div>
              <div><label className="label">IE/RG</label><input className="input" value={form.ie_rg||''} onChange={e=>setForm({...form, ie_rg:e.target.value})}/></div>
              <div><label className="label">Telefone</label><input className="input" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})}/></div>
              <div><label className="label">Telefone 2</label><input className="input" value={form.phone_alt||''} onChange={e=>setForm({...form, phone_alt:e.target.value})}/></div>
              <div className="col-span-2"><label className="label">Email</label><input className="input" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})}/></div>
              <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address||''} onChange={e=>setForm({...form, address:e.target.value})}/></div>
              <div><label className="label">Cidade</label><input className="input" value={form.city||''} onChange={e=>setForm({...form, city:e.target.value})}/></div>
              <div><label className="label">UF</label><input className="input" value={form.state||''} onChange={e=>setForm({...form, state:e.target.value})}/></div>
              <div><label className="label">CEP</label><input className="input" value={form.zip||''} onChange={e=>setForm({...form, zip:e.target.value})}/></div>
              <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={3} value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn" onClick={async()=>{
                if(!form.name){ alert('Nome obrigatório'); return }
                if(form.id) await dal.customers.update(form.id, form); else await dal.customers.create(form)
                setShow(false); await load()
              }}>Salvar</button>
              <button className="btn" onClick={()=>setShow(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
