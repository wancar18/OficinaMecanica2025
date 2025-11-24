import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'
import { exportToCSV, exportToXLSX } from '../../utils/export'
import { currency } from '../../utils/format'

export default function Reports(){
  const [from,setFrom]=useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,setTo]=useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [kind,setKind]=useState('servicos')
  const [rows,setRows]=useState<any[]>([])

  async function load(){
    await db.ensureReady()
    if(kind==='servicos'){
      setRows(await dal.reports.topServices(from,to))
    } else if(kind==='receitas'){
      setRows(await dal.payments.list({ from, to }))
    } else if(kind==='despesas'){
      setRows(await dal.expenses.list({ from, to }))
    }
  }
  useEffect(()=>{ load() },[kind])

  return (
    <div className="grid gap-4">
      <div className="card flex items-end gap-2">
        <div><label className="label">De</label><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label className="label">Até</label><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <div><label className="label">Relatório</label>
          <select className="input" value={kind} onChange={e=>setKind(e.target.value)}>
            <option value="servicos">Serviços prestados (top 5)</option>
            <option value="receitas">Receitas</option>
            <option value="despesas">Despesas</option>
          </select>
        </div>
        <button className="btn" onClick={load}>Filtrar</button>
        <div className="ml-auto"></div>
        <button className="btn" onClick={()=>exportToCSV(`${kind}_${from}_${to}`, rows)}>CSV</button>
        <button className="btn" onClick={()=>exportToXLSX(`${kind}_${from}_${to}.xlsx`, rows)}>Excel</button>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>{Object.keys(rows[0]||{}).map(k=><th key={k}>{k}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                {Object.values(r).map((v,j)=><td key={j}>{typeof v==='number'?currency(Number(v)):String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
