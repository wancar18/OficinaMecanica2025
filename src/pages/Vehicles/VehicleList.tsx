import React, { useEffect, useState } from 'react'
import { dal, db } from '../../db/dal'
import dayjs from 'dayjs'

interface VehicleForm {
  id?: number
  plate: string
  brand: string
  model: string
  year: number | '' | null
  color: string
  vin: string
  engine: string
  mileage: number | '' | null
  fuel: string
  notes: string
  customer_name: string
}

export default function VehiclesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<VehicleForm>({
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    engine: '',
    mileage: '',
    fuel: '',
    notes: '',
    customer_name: ''
  })

  const [customerQuery, setCustomerQuery] = useState('')
  const [customerOptions, setCustomerOptions] = useState<any[]>([])

  async function load() {
    setLoading(true)
    await db.ensureReady()
    const list = await dal.vehicles.list(q)
    setRows(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setForm({
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      vin: '',
      engine: '',
      mileage: '',
      fuel: '',
      notes: '',
      customer_name: ''
    })
    setCustomerQuery('')
    setCustomerOptions([])
    setShowModal(true)
  }

  function openEdit(v: any) {
    setForm({
      id: v.id,
      plate: v.plate || '',
      brand: v.brand || '',
      model: v.model || '',
      year: v.year || '',
      color: v.color || '',
      vin: v.vin || '',
      engine: v.engine || '',
      mileage: v.mileage ?? '',
      fuel: v.fuel || '',
      notes: v.notes || '',
      customer_name: v.customer_name || ''
    })
    setCustomerQuery(v.customer_name || '')
    setCustomerOptions([])
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.customer_name.trim()) {
      alert('Informe o cliente (nome).')
      return
    }
    if (!form.plate.trim()) {
      alert('Informe a placa.')
      return
    }

    const payload = {
      plate: form.plate.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: form.year === '' ? null : Number(form.year),
      color: form.color.trim(),
      vin: form.vin.trim(),
      engine: form.engine.trim(),
      mileage: form.mileage === '' ? null : Number(form.mileage),
      fuel: form.fuel.trim(),
      notes: form.notes.trim(),
      customer_name: form.customer_name.trim()
    }

    try {
      await db.ensureReady()
      if (form.id) {
        await dal.vehicles.update(form.id, payload)
      } else {
        await dal.vehicles.create(payload)
      }
      setShowModal(false)
      await load()
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar veículo')
    }
  }

  async function searchCustomersByName(name: string) {
    setCustomerQuery(name)
    setForm(f => ({ ...f, customer_name: name }))
    if (!name.trim()) {
      setCustomerOptions([])
      return
    }
    await db.ensureReady()
    const list = await dal.customers.list(name.trim())
    setCustomerOptions(list.slice(0, 10))
  }

  return (
    <div className="grid gap-4">
      <div className="card flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Busca</label>
          <input
            className="input"
            placeholder="Placa, Cliente..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <button className="btn mt-4 md:mt-6" onClick={load}>
          {loading ? 'Carregando...' : 'Filtrar'}
        </button>
        <div className="ml-auto"></div>
        <button className="btn mt-4 md:mt-6" onClick={openNew}>
          Novo veículo
        </button>
      </div>

      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Cliente</th>
              <th>Marca/Modelo</th>
              <th>Ano</th>
              <th>Cor</th>
              <th>KM</th>
              <th>Combustível</th>
              <th>Criado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.plate}</td>
                <td>{r.customer_name}</td>
                <td>{[r.brand, r.model].filter(Boolean).join(' ')}</td>
                <td>{r.year || ''}</td>
                <td>{r.color}</td>
                <td>{r.mileage ?? ''}</td>
                <td>{r.fuel}</td>
                <td>{r.created_at ? dayjs(r.created_at).format('DD/MM/YYYY') : ''}</td>
                <td>
                  <button className="link" onClick={() => openEdit(r)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="text-center text-sm text-gray-400 py-4">
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {form.id ? 'Editar veículo' : 'Novo veículo'}
              </h2>
              <button className="btn" onClick={() => setShowModal(false)}>
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cliente por nome */}
              <div className="relative">
                <label className="label">Cliente (nome)</label>
                <input
                  className="input"
                  placeholder="Digite o nome do cliente..."
                  value={customerQuery}
                  onChange={e => searchCustomersByName(e.target.value)}
                />
                {customerOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-gray-700 bg-gray-800">
                    {customerOptions.map(c => (
                      <button
                        key={c.id}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-700"
                        onClick={() => {
                          setCustomerQuery(c.name)
                          setForm(f => ({ ...f, customer_name: c.name }))
                          setCustomerOptions([])
                        }}
                      >
                        {c.name}
                        {c.cpf_cnpj && (
                          <span className="ml-1 text-xs text-gray-400">
                            • {c.cpf_cnpj}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Placa</label>
                <input
                  className="input"
                  placeholder="ABC1D23"
                  value={form.plate}
                  onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))}
                />
              </div>

              <div>
                <label className="label">Marca</label>
                <input
                  className="input"
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Modelo</label>
                <input
                  className="input"
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Ano</label>
                <input
                  className="input"
                  type="number"
                  value={form.year ?? ''}
                  onChange={e =>
                    setForm(f => ({ ...f, year: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="label">Cor</label>
                <input
                  className="input"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Chassi (VIN)</label>
                <input
                  className="input"
                  value={form.vin}
                  onChange={e => setForm(f => ({ ...f, vin: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Motor</label>
                <input
                  className="input"
                  value={form.engine}
                  onChange={e => setForm(f => ({ ...f, engine: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">KM atual</label>
                <input
                  className="input"
                  type="number"
                  value={form.mileage ?? ''}
                  onChange={e =>
                    setForm(f => ({ ...f, mileage: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="label">Combustível</label>
                <input
                  className="input"
                  placeholder="Gasolina, Etanol, Flex..."
                  value={form.fuel}
                  onChange={e => setForm(f => ({ ...f, fuel: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Observações</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn" onClick={handleSave}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
