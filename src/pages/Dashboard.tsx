import React, { useEffect, useState } from 'react'
import { dal, db } from '../db/dal'
import { currency } from '../utils/format'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import dayjs from 'dayjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

export default function Dashboard(){
  const [kpis,setKpis]=useState<any>({})
  const [top,setTop]=useState<any[]>([])
  const [flow,setFlow]=useState<any>({ receipts:[], expenses:[] })

  useEffect(()=>{
    (async()=>{
      await db.ensureReady()
      const from = dayjs().startOf('month').format('YYYY-MM-DD')
      const to = dayjs().endOf('month').format('YYYY-MM-DD')
      setKpis(await dal.reports.kpis(from,to))
      setTop(await dal.reports.topServices(from,to))
      setFlow(await dal.reports.cashFlowByDay(from,to))
    })()
  },[])

  const days = Array.from(new Set([...flow.receipts.map((r:any)=>r.d), ...flow.expenses.map((e:any)=>e.d)])).sort()
  const recMap = Object.fromEntries(flow.receipts.map((r:any)=>[r.d, r.v]))
  const expMap = Object.fromEntries(flow.expenses.map((e:any)=>[e.d, e.v]))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="card"><div className="text-sm text-gray-400">OS Abertas</div><div className="text-2xl font-bold">{kpis.open_orders||0}</div></div>
        <div className="card"><div className="text-sm text-gray-400">OS Concluídas</div><div className="text-2xl font-bold">{kpis.closed_orders||0}</div></div>
        <div className="card"><div className="text-sm text-gray-400">Ticket Médio</div><div className="text-2xl font-bold">{currency(kpis.ticket_medio||0)}</div></div>
        <div className="card"><div className="text-sm text-gray-400">Saldo (mês)</div><div className="text-2xl font-bold">{currency((kpis.receita||0)-(kpis.despesas||0))}</div></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="font-semibold mb-2">Receita vs Despesa (mês)</div>
          <Bar data={{
            labels: days.map(d=>dayjs(d).format('DD/MM')),
            datasets: [
              { label: 'Receitas', data: days.map(d=>recMap[d]||0) },
              { label: 'Despesas', data: days.map(d=>expMap[d]||0) }
            ]
          }}/>
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Top 5 Serviços</div>
          <Bar data={{
            labels: top.map(t=>t.servico),
            datasets: [{ label:'Valor', data: top.map(t=>t.valor) }]
          }}/>
        </div>
      </div>
    </div>
  )
}
