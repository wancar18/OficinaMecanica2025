import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'
import { currency } from '../../utils/format'

export default function ReceiptsList(){
  const [rows,setRows]=useState<any[]>([])
  const [from,setFrom]=useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,setTo]=useState(dayjs().endOf('month').format('YYYY-MM-DD'))

  async function load(){
    await db.ensureReady()
    setRows(await dal.payments.list({ from, to }))
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex items-end gap-2">
        <div><label className="label">De</label><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label className="label">Até</label><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <button className="btn" onClick={load}>Filtrar</button>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead><tr><th>Data</th><th>Forma</th><th>Valor</th><th>Status</th><th>OS</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{dayjs(r.date).format('DD/MM/YYYY')}</td>
                <td>{r.method}</td>
                <td>{currency(r.amount)}</td>
                <td>{r.status}</td>
                <td>{r.order_id||''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
