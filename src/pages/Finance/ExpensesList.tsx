import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'
import { currency } from '../../utils/format'

export default function ExpensesList(){
  const [rows,setRows]=useState<any[]>([])
  const [from,setFrom]=useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,setTo]=useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [form,setForm]=useState<any>({ date: dayjs().format('YYYY-MM-DD'), category:'Outros', method:'outro', amount:0 })
  const [show,setShow]=useState(false)

  async function load(){
    await db.ensureReady()
    setRows(await dal.expenses.list({ from, to }))
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex items-end gap-2">
        <div><label className="label">De</label><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label className="label">Até</label><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <button className="btn" onClick={load}>Filtrar</button>
        <div className="ml-auto"></div>
        <button className="btn" onClick={()=>setShow(true)}>Nova Despesa</button>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead><tr><th>Data</th><th>Categoria</th><th>Método</th><th>Fornecedor</th><th>Descrição</th><th>Valor</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{dayjs(r.date).format('DD/MM/YYYY')}</td>
                <td>{r.category}</td>
                <td>{r.method}</td>
                <td>{r.vendor||''}</td>
                <td>{r.description||''}</td>
                <td>{currency(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6">
          <div className="card max-w-xl w-full">
            <div className="font-semibold mb-2">Nova Despesa</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Data</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/></div>
              <div><label className="label">Categoria</label><input className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}/></div>
              <div><label className="label">Método</label><input className="input" value={form.method} onChange={e=>setForm({...form, method:e.target.value})}/></div>
              <div><label className="label">Fornecedor</label><input className="input" value={form.vendor||''} onChange={e=>setForm({...form, vendor:e.target.value})}/></div>
              <div className="col-span-2"><label className="label">Descrição</label><input className="input" value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})}/></div>
              <div><label className="label">Valor</label><input className="input" type="number" value={form.amount||0} onChange={e=>setForm({...form, amount:Number(e.target.value)})}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn" onClick={async()=>{ await dal.expenses.add(form); setShow(false); await load() }}>Salvar</button>
              <button className="btn" onClick={()=>setShow(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
