import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

export default function CashFlow(){
  const [from,setFrom]=useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,setTo]=useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [flow,setFlow]=useState<any>({ receipts:[], expenses:[] })

  async function load(){
    await db.ensureReady()
    setFlow(await dal.reports.cashFlowByDay(from,to))
  }
  useEffect(()=>{ load() },[])

  const days = Array.from(new Set([...flow.receipts.map((r:any)=>r.d), ...flow.expenses.map((e:any)=>e.d)])).sort()
  const recMap = Object.fromEntries(flow.receipts.map((r:any)=>[r.d, r.v]))
  const expMap = Object.fromEntries(flow.expenses.map((e:any)=>[e.d, e.v]))
  let balance:number[] = []; let acc = 0
  for(const d of days){ acc += (recMap[d]||0) - (expMap[d]||0); balance.push(acc) }

  return (
    <div className="grid gap-4">
      <div className="card flex items-end gap-2">
        <div><label className="label">De</label><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label className="label">Até</label><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <button className="btn" onClick={load}>Filtrar</button>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Fluxo de Caixa</div>
        <Line data={{
          labels: days.map(d=>dayjs(d).format('DD/MM')),
          datasets: [{ label: 'Saldo', data: balance }]
        }}/>
      </div>
    </div>
  )
}
