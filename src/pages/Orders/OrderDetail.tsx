import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dal, db } from '../../db/dal'
import { currency, dateBR } from '../../utils/format'
import dayjs from 'dayjs'
import { orderToPDF } from '../../utils/pdf'
import { useAuthStore } from '../../store/auth'

const methods = ['dinheiro','cartao_credito','cartao_debito','pix','boleto','transferencia','outro']

export default function OrderDetail(){
  const { id } = useParams()
  const [data,setData]=useState<any>(null)
  const [svcQuery,setSvcQuery]=useState('')
  const [svcList,setSvcList]=useState<any[]>([])
  const [newItem,setNewItem]=useState<any>({ description:'', qty:1, unit_price:0, discount:0 })
  const [pay,setPay]=useState<any>({ amount:0, method:'pix', date:dayjs().format('YYYY-MM-DD'), status:'recebido' })
  const [editPay, setEditPay] = useState<any|null>(null)
  const user = useAuthStore(s=>s.user)!

  async function load(){
    await db.ensureReady()
    const d = await dal.orders.get(Number(id))
    setData(d)
  }

  useEffect(()=>{ load() },[id])

  async function searchServices(q:string){
    setSvcQuery(q)
    setSvcList(await dal.services.list(q))
  }

  if(!data) return <div>Carregando…</div>

  const { order, items, payments, customer, vehicle } = data

  // Total recebido e quanto falta
  const totalRecebido = payments
    .filter((p:any)=>p.status === 'recebido')
    .reduce((sum:number, p:any)=> sum + (p.amount || 0), 0)
  const faltaPagar = Math.max((order.total || 0) - totalRecebido, 0)

  return (
    <div className="grid gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">OS {order.code}</h1>
          <div className="text-sm text-gray-400">
            {customer.name} • {vehicle.brand||''} {vehicle.model||''} • Placa {vehicle.plate}
          </div>
          <div className="text-xs text-gray-500">
            Abertura: {dateBR(order.opened_at)} • Status: {order.status} • Pagamento: {order.payment_status}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={async()=>{
            const doc = orderToPDF(data)
            doc.save(`${order.code}.pdf`)
          }}>
            Imprimir/Orçamento
          </button>
          <select
            className="input"
            value={order.status}
            onChange={async e=>{
              try{
                await dal.orders.setStatus(order.id, e.target.value, user.id)
                await load()
              }catch(err:any){ alert(err.message) }
            }}
          >
            {['aberta','aprovada','em_execucao','concluida','entregue','cancelada'].map(s=>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Itens (Serviços/Peças) */}
        <div className="card col-span-3 lg:col-span-2">
          <div className="font-semibold mb-2">Itens (Serviços/Peças)</div>

          {/* Linha de inclusão de item — Serviço maior */}
          <div className="grid grid-cols-12 gap-2 items-end mb-3">
            <div className="col-span-12 md:col-span-7">
              <label className="label">Serviço</label>
              <input
                className="input w-full"
                placeholder="Pesquisar catálogo…"
                value={svcQuery}
                onChange={e=>searchServices(e.target.value)}
              />
              {svcList.length>0 && (
                <div className="mt-1 max-h-56 overflow-auto bg-gray-800 border border-gray-700 rounded">
                  {svcList.map(s=>(
                    <button
                      key={s.id}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-700"
                      onClick={()=>{
                        setNewItem({
                          description: s.name,
                          qty: 1,
                          unit_price: s.default_price,
                          discount: 0,
                          item_type:'service'
                        })
                        setSvcList([])
                        setSvcQuery(s.name)
                      }}
                    >
                      {s.name} • R$ {s.default_price}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-4 md:col-span-2">
              <label className="label">Qtd</label>
              <input
                className="input w-full"
                type="number"
                value={newItem.qty||1}
                onChange={e=>setNewItem({...newItem, qty: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="label">Vlr Unit</label>
              <input
                className="input w-full"
                type="number"
                value={newItem.unit_price||0}
                onChange={e=>setNewItem({...newItem, unit_price: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="label">Desc</label>
              <input
                className="input w-full"
                type="number"
                value={newItem.discount||0}
                onChange={e=>setNewItem({...newItem, discount: Number(e.target.value)})}
              />
            </div>

            <div className="col-span-12 md:col-span-1">
              <button
                className="btn w-full"
                onClick={async()=>{
                  if(!newItem.description){ alert('Informe a descrição'); return }
                  await dal.orders.addItem(order.id, newItem)
                  setNewItem({ description:'', qty:1, unit_price:0, discount:0 })
                  setSvcQuery('')
                  await load()
                }}
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Tabela de itens */}
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th><th>Qtd</th><th>Unit</th><th>Desc</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it:any)=>(
                <tr key={it.id}>
                  <td>{it.description}</td>
                  <td>{it.qty}</td>
                  <td>{currency(it.unit_price)}</td>
                  <td>{currency(it.discount)}</td>
                  <td>{currency(it.total)}</td>
                  <td>
                    <button
                      className="link"
                      onClick={async()=>{
                        await dal.orders.removeItem(it.id)
                        await load()
                      }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo + Recebimentos */}
        <div className="card col-span-3 lg:col-span-1">
          <div className="font-semibold mb-2">Resumo</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Serviços</span><span>{currency(order.total_services)}</span>
            </div>
            <div className="flex justify-between">
              <span>Peças</span><span>{currency(order.total_parts)}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto</span><span>{currency(order.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Acréscimo</span><span>{currency(order.surcharge)}</span>
            </div>
            <div className="flex justify-between font-semibold text-yellow-300">
              <span>Total OS</span><span>{currency(order.total)}</span>
            </div>
            <div className="flex justify-between text-green-300">
              <span>Recebido</span><span>{currency(totalRecebido)}</span>
            </div>
            <div className="flex justify-between font-semibold text-red-300">
              <span>Falta pagar</span><span>{currency(faltaPagar)}</span>
            </div>
          </div>

          {/* Lançar recebimento */}
          <div className="mt-4">
            <div className="font-semibold mb-2">Receber</div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <label className="label">Valor</label>
                <input
                  className="input"
                  type="number"
                  value={pay.amount}
                  onChange={e=>setPay({...pay, amount: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="label">Forma</label>
                <select
                  className="input"
                  value={pay.method}
                  onChange={e=>setPay({...pay, method:e.target.value})}
                >
                  {methods.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={pay.date}
                  onChange={e=>setPay({...pay, date:e.target.value})}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={pay.status}
                  onChange={e=>setPay({...pay, status:e.target.value})}
                >
                  {['recebido','pendente','estornado'].map(s=>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Observação</label>
                <input
                  className="input"
                  value={pay.notes||''}
                  onChange={e=>setPay({...pay, notes:e.target.value})}
                />
              </div>
            </div>
            <button
              className="btn w-full mt-2"
              onClick={async()=>{
                await dal.payments.add({ ...pay, order_id: order.id })
                await load()
              }}
            >
              Lançar
            </button>
          </div>

          {/* Lista de pagamentos */}
          <div className="mt-4">
            <div className="font-semibold mb-2">Pagamentos</div>
            <div className="overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Forma</th><th>Status</th><th>Valor</th><th></th></tr>
                </thead>
                <tbody>
                  {payments.map((p:any)=>(
                    <tr key={p.id}>
                      <td>{dayjs(p.date).format('DD/MM/YYYY')}</td>
                      <td>{p.method}</td>
                      <td>{p.status}</td>
                      <td>{currency(p.amount)}</td>
                      <td className="whitespace-nowrap">
                        <button className="link" onClick={()=> setEditPay({...p})}>Editar</button>
                        <button
                          className="link text-red-400 ml-3"
                          onClick={async()=>{
                            if(confirm('Excluir este recebimento?')){
                              await dal.payments.remove(p.id)
                              await load()
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de edição de recebimento */}
      {editPay && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-6 z-50">
          <div className="card w-full max-w-md">
            <div className="font-semibold mb-2">Editar recebimento</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={dayjs(editPay.date).format('YYYY-MM-DD')}
                  onChange={e=>setEditPay({...editPay, date: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Forma</label>
                <select
                  className="input"
                  value={editPay.method}
                  onChange={e=>setEditPay({...editPay, method: e.target.value})}
                >
                  {methods.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={editPay.status}
                  onChange={e=>setEditPay({...editPay, status: e.target.value})}
                >
                  {['recebido','pendente','estornado'].map(s=>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Valor</label>
                <input
                  type="number"
                  className="input"
                  value={editPay.amount}
                  onChange={e=>setEditPay({...editPay, amount: Number(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Observação</label>
                <input
                  className="input"
                  value={editPay.notes||''}
                  onChange={e=>setEditPay({...editPay, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={()=>setEditPay(null)}>Cancelar</button>
              <button
                className="btn"
                onClick={async()=>{
                  await dal.payments.update({
                    id: editPay.id,
                    date: dayjs(editPay.date).format('YYYY-MM-DD'),
                    method: editPay.method,
                    amount: Number(editPay.amount)||0,
                    status: editPay.status,
                    notes: editPay.notes||''
                  })
                  setEditPay(null)
                  await load()
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
