import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'

export default function ServiceList(){
  const [rows,setRows]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [form,setForm]=useState<any>({})
  const [show,setShow]=useState(false)

  async function load(){
    await db.ensureReady()
    setRows(await dal.services.list(q))
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex gap-2 items-end">
        <div><label className="label">Buscar</label><input className="input" value={q} onChange={e=>setQ(e.target.value)} /></div>
        <button className="btn" onClick={load}>Filtrar</button>
        <div className="ml-auto"></div>
        <button className="btn" onClick={()=>{ setForm({}); setShow(true) }}>Novo Serviço</button>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead><tr><th>Nome</th><th>Preço</th><th>Horas</th><th>Ativo</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>R$ {r.default_price}</td>
                <td>{r.default_hours}</td>
                <td>{r.active?'Sim':'Não'}</td>
                <td><button className="link" onClick={()=>{ setForm(r); setShow(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6">
          <div className="card max-w-xl w-full">
            <div className="font-semibold mb-2">{form.id? 'Editar Serviço':'Novo Serviço'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})}/></div>
              <div className="col-span-2"><label className="label">Descrição</label><textarea className="input" rows={3} value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})}/></div>
              <div><label className="label">Preço Padrão</label><input className="input" type="number" value={form.default_price||0} onChange={e=>setForm({...form, default_price:Number(e.target.value)})}/></div>
              <div><label className="label">Tempo (h)</label><input className="input" type="number" value={form.default_hours||0} onChange={e=>setForm({...form, default_hours:Number(e.target.value)})}/></div>
              <div className="col-span-2"><label className="label">Ativo?</label>
                <select className="input" value={(form.active??1)?1:0} onChange={e=>setForm({...form, active:Number(e.target.value)})}>
                  <option value={1}>Sim</option><option value={0}>Não</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn" onClick={async()=>{ if(form.id) await dal.services.update(form.id, form); else await dal.services.create(form); setShow(false); await load() }}>Salvar</button>
              <button className="btn" onClick={()=>setShow(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
