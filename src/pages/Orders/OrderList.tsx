import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'
import { currency, dateBR } from '../../utils/format'
import { normalizePlate, isValidPlate } from '../../utils/plate'
import { useAuthStore } from '../../store/auth'

export default function OrdersList(){
  const [rows,setRows]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [status,setStatus]=useState('todos')
  const [from,setFrom]=useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,setTo]=useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [plate,setPlate]=useState('')
  const user = useAuthStore(s=>s.user)!
  const navigate = useNavigate()

  async function refresh(){
    await db.ensureReady()
    setRows(await dal.orders.list({ q, status, from, to }))
  }

  useEffect(()=>{ refresh() },[])

  return (
    <div className="grid gap-4">
      <div className="card flex items-end gap-2">
        <div>
          <label className="label">Busca</label>
          <input
            className="input"
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="OS #, Placa, Cliente"
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            {['todos','aberta','aprovada','em_execucao','concluida','entregue','cancelada'].map(s=>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label">De</label>
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)}/>
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)}/>
        </div>
        <button className="btn" onClick={refresh}>Filtrar</button>
        <div className="ml-auto"></div>
        <div>
          <label className="label">Nova OS pela placa</label>
          <div className="flex gap-2">
            <input
              className="input"
              value={plate}
              onChange={e=>setPlate(e.target.value)}
              placeholder="ABC1D23"
            />
            <button
              className="btn"
              onClick={async()=>{
                await db.ensureReady()

                // Tenta achar o veículo pela placa digitada
                const v = await dal.vehicles.findByPlate(plate)
                if (v) {
                  // Veículo já existe: abre OS e navega sem recarregar a página
                  const id = await dal.orders.openByPlate(v.plate, user.id, v.mileage||0)
                  navigate('/os/'+id)
                } else {
                  // Cadastro rápido: valida a placa e pede o nome do cliente
                  const p = normalizePlate(plate)
                  if(!isValidPlate(p)) { alert('Placa inválida'); return }
                  const name = prompt('Cliente (nome/razão):')
                  if(!name) return

                  // Opção atômica: cria cliente+veículo e já abre a OS
                  const id = await dal.orders.quickCreateWithNewCustomerVehicle(
                    { customer: { name }, vehicle: { plate: p } },
                    user.id
                  )
                  navigate('/os/'+id)
                }
              }}
            >
              Abrir
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th><th>Cliente</th><th>Placa</th><th>Status</th><th>Pagamento</th><th>Total</th><th>Aberta em</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.customer_name}</td>
                <td>{r.plate}</td>
                <td><span className="badge badge-yellow">{r.status}</span></td>
                <td>{r.payment_status}</td>
                <td>{currency(r.total)}</td>
                <td>{dateBR(r.opened_at)}</td>
                <td><Link className="link" to={`/os/${r.id}`}>Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
