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
  
  // Novos estados para o Modal de Novo Cliente
  const [showClientModal, setShowClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [pendingPlate, setPendingPlate] = useState('')

  const user = useAuthStore(s=>s.user)!
  const navigate = useNavigate()

  async function refresh(){
    await db.ensureReady()
    setRows(await dal.orders.list({ q, status, from, to }))
  }

  useEffect(()=>{ refresh() },[])

  async function handleOpenOrder() {
    if (!plate) return
    await db.ensureReady()

    // 1. Tenta achar o veículo pela placa digitada
    const v = await dal.vehicles.findByPlate(plate)
    
    if (v) {
      // Veículo já existe: abre OS imediatamente
      try {
        const id = await dal.orders.openByPlate(v.plate, user.id, v.mileage||0)
        navigate('/os/'+id)
      } catch (err:any) {
        alert(err.message)
      }
    } else {
      // Veículo não existe: Valida placa e abre modal para pedir nome do cliente
      const p = normalizePlate(plate)
      if(!isValidPlate(p)) { 
        alert('Placa inválida') 
        return 
      }
      
      // Salva a placa e abre o modal
      setPendingPlate(p)
      setNewClientName('')
      setShowClientModal(true)
    }
  }

  async function confirmNewClient() {
    if (!newClientName.trim()) {
      alert('Por favor, informe o nome do cliente.')
      return
    }

    try {
      // Cria cliente, veículo e abre a OS em uma única operação
      const id = await dal.orders.quickCreateWithNewCustomerVehicle(
        { customer: { name: newClientName }, vehicle: { plate: pendingPlate } },
        user.id
      )
      setShowClientModal(false)
      navigate('/os/'+id)
    } catch (err:any) {
      alert('Erro ao criar OS: ' + err.message)
    }
  }

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
              className="input uppercase"
              value={plate}
              onChange={e=>setPlate(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              onKeyDown={e => e.key === 'Enter' && handleOpenOrder()}
            />
            <button className="btn" onClick={handleOpenOrder}>
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

      {/* Modal para cadastrar cliente rápido */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6 z-50">
          <div className="card w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Novo Cadastro Rápido</h2>
            <p className="text-sm text-gray-400 mb-4">
              O veículo de placa <strong className="text-white">{pendingPlate}</strong> não foi encontrado. 
              Informe o nome do cliente para cadastrar ambos e abrir a OS.
            </p>
            
            <div className="mb-4">
              <label className="label">Nome do Cliente</label>
              <input 
                className="input" 
                value={newClientName} 
                onChange={e => setNewClientName(e.target.value)}
                placeholder="Ex: João da Silva"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn bg-gray-700 hover:bg-gray-600 text-white" onClick={() => setShowClientModal(false)}>
                Cancelar
              </button>
              <button className="btn" onClick={confirmNewClient}>
                Confirmar e Abrir OS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}