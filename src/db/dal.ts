import * as sql from './sqljs'
import { MIGRATIONS_SQL } from './migrations'
import bcrypt from 'bcryptjs'
import dayjs from 'dayjs'

export const db = {
  ready: false,
  async ensureReady(){
    if(this.ready) return
    await sql.initDb()
    await sql.exec(MIGRATIONS_SQL)
    const seeded = await sql.queryOne<{value:string}>('SELECT value FROM _meta WHERE key=?', ['seed_v1'])
    if(!seeded){
      const hash = bcrypt.hashSync('123', 10)
      await sql.exec(
        'INSERT INTO users (username, display_name, role, password_hash, must_change_password, active) VALUES (?,?,?,?,1,1)',
        ['admin','Administrador','admin', hash]
      )
      const cats = ['Peças','Ferramentas','Água/Luz','Serviços Terceiros','Outros']
      for(const c of cats){
        await sql.exec(
          'INSERT INTO expenses (date, category, method, vendor, description, amount, notes) VALUES (date("now"), ?, "outro", "", ?, 0, "")',
          [c, 'Categoria inicial']
        )
      }
      await sql.exec('INSERT OR REPLACE INTO _meta (key, value) VALUES (?,?)', ['seed_v1', dayjs().toISOString()])
    }
    this.ready = true
  }
}

function normalizePlate(p:string){
  return p.toUpperCase().replace(/[^A-Z0-9]/g,'')
}

export const dal = {
  users: {
    async get(id:number){
      await db.ensureReady()
      return await sql.queryOne<any>('SELECT * FROM users WHERE id=?',[id])
    },
    async findByUsername(username:string){
      await db.ensureReady()
      return await sql.queryOne<any>('SELECT * FROM users WHERE username=?',[username])
    },
    async list(){
      await db.ensureReady()
      return await sql.queryAll<any>('SELECT id, username, display_name, role, must_change_password, active, created_at FROM users ORDER BY id DESC')
    },
    async create(u:{username:string, display_name?:string, role:string, password:string}){
      await db.ensureReady()
      const hash = bcrypt.hashSync(u.password, 10)
      await sql.exec(
        'INSERT INTO users (username, display_name, role, password_hash, must_change_password, active) VALUES (?,?,?,?,0,1)',
        [u.username, u.display_name||'', u.role, hash]
      )
    },
    async updatePassword(userId:number, hash:string, mustChange:number){
      await db.ensureReady()
      await sql.exec('UPDATE users SET password_hash=?, must_change_password=? WHERE id=?',[hash, mustChange, userId])
    },
    async toggleActive(id:number, active:number){
      await db.ensureReady()
      await sql.exec('UPDATE users SET active=? WHERE id=?',[active, id])
    }
  },

  customers: {
    async list(filter:string=''){
      await db.ensureReady()
      if(filter){
        const f = `%${filter}%`
        return await sql.queryAll<any>(
          'SELECT * FROM customers WHERE name LIKE ? OR alias LIKE ? OR cpf_cnpj LIKE ? ORDER BY id DESC',
          [f,f,f]
        )
      }
      return await sql.queryAll<any>('SELECT * FROM customers ORDER BY id DESC')
    },
    async create(c:any){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO customers (name, alias, cpf_cnpj, ie_rg, email, phone, phone_alt, address, city, state, zip, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [c.name,c.alias||'',c.cpf_cnpj||'',c.ie_rg||'',c.email||'',c.phone||'',c.phone_alt||'',c.address||'',c.city||'',c.state||'',c.zip||'',c.notes||'']
      )
      const row = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
      return row?.id as number
    },
    async get(id:number){
      await db.ensureReady()
      return await sql.queryOne<any>('SELECT * FROM customers WHERE id=?',[id])
    },
    async update(id:number, c:any){
      await db.ensureReady()
      await sql.exec(
        'UPDATE customers SET name=?, alias=?, cpf_cnpj=?, ie_rg=?, email=?, phone=?, phone_alt=?, address=?, city=?, state=?, zip=?, notes=? WHERE id=?',
        [c.name,c.alias||'',c.cpf_cnpj||'',c.ie_rg||'',c.email||'',c.phone||'',c.phone_alt||'',c.address||'',c.city||'',c.state||'',c.zip||'',c.notes||'', id]
      )
    }
  },

  vehicles: {
    async list(filter:string=''){
      await db.ensureReady()
      if(filter){
        const f = `%${normalizePlate(filter)}%`
        return await sql.queryAll<any>(
          'SELECT v.*, c.name as customer_name FROM vehicles v JOIN customers c ON c.id=v.customer_id WHERE v.plate LIKE ? ORDER BY v.id DESC',
          [f]
        )
      }
      return await sql.queryAll<any>(
        'SELECT v.*, c.name as customer_name FROM vehicles v JOIN customers c ON c.id=v.customer_id ORDER BY v.id DESC'
      )
    },
    async get(id:number){
      await db.ensureReady()
      return await sql.queryOne<any>('SELECT * FROM vehicles WHERE id=?',[id])
    },
    async findByPlate(plate:string){
      await db.ensureReady()
      const p = normalizePlate(plate)
      return await sql.queryOne<any>('SELECT * FROM vehicles WHERE plate=?',[p])
    },
    async create(v:any){
      await db.ensureReady()

      // Permitir informar cliente por nome, não só por ID
      let customer_id = v.customer_id as number|undefined

      if (!customer_id && v.customer_name) {
        const existing = await sql.queryOne<any>(
          'SELECT id FROM customers WHERE name = ? LIMIT 1',
          [v.customer_name]
        )
        if (existing) {
          customer_id = existing.id
        } else {
          // cria novo cliente só com o nome
          await sql.exec(
            'INSERT INTO customers (name, alias, cpf_cnpj, ie_rg, email, phone, phone_alt, address, city, state, zip, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [v.customer_name, '', '', '', '', '', '', '', '', '', '', '']
          )
          const rowC = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
          customer_id = rowC?.id
        }
      }

      if (!customer_id) {
        throw new Error('Cliente obrigatório para cadastrar veículo.')
      }

      const p = normalizePlate(v.plate)
      await sql.exec(
        'INSERT INTO vehicles (customer_id, plate, brand, model, year, color, vin, engine, mileage, fuel, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [customer_id, p, v.brand||'', v.model||'', v.year||null, v.color||'', v.vin||'', v.engine||'', v.mileage||0, v.fuel||'', v.notes||'']
      )
      const row = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
      return row?.id as number
    },
    async update(id:number, v:any){
      await db.ensureReady()

      let customer_id = v.customer_id as number|undefined

      if (!customer_id && v.customer_name) {
        const existing = await sql.queryOne<any>(
          'SELECT id FROM customers WHERE name = ? LIMIT 1',
          [v.customer_name]
        )
        if (existing) {
          customer_id = existing.id
        } else {
          await sql.exec(
            'INSERT INTO customers (name, alias, cpf_cnpj, ie_rg, email, phone, phone_alt, address, city, state, zip, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [v.customer_name, '', '', '', '', '', '', '', '', '', '', '']
          )
          const rowC = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
          customer_id = rowC?.id
        }
      }

      if (!customer_id) {
        throw new Error('Cliente obrigatório para atualizar veículo.')
      }

      const p = normalizePlate(v.plate)
      await sql.exec(
        'UPDATE vehicles SET customer_id=?, plate=?, brand=?, model=?, year=?, color=?, vin=?, engine=?, mileage=?, fuel=?, notes=? WHERE id=?',
        [customer_id, p, v.brand||'', v.model||'', v.year||null, v.color||'', v.vin||'', v.engine||'', v.mileage||0, v.fuel||'', v.notes||'', id]
      )
    }
  },

  services: {
    async list(filter:string=''){
      await db.ensureReady()
      if(filter){
        const f = `%${filter}%`
        return await sql.queryAll<any>(
          'SELECT * FROM service_catalog WHERE (name LIKE ? OR description LIKE ?) AND active=1 ORDER BY name',
          [f,f]
        )
      }
      return await sql.queryAll<any>('SELECT * FROM service_catalog WHERE active=1 ORDER BY name')
    },
    async create(s:any){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO service_catalog (name, description, default_price, default_hours, active) VALUES (?,?,?,?,1)',
        [s.name, s.description||'', s.default_price||0, s.default_hours||0]
      )
    },
    async update(id:number, s:any){
      await db.ensureReady()
      await sql.exec(
        'UPDATE service_catalog SET name=?, description=?, default_price=?, default_hours=?, active=? WHERE id=?',
        [s.name, s.description||'', s.default_price||0, s.default_hours||0, s.active?1:0, id]
      )
    }
  },

  orders: {
    async list(params:{q?:string, status?:string, from?:string, to?:string}={}){
      await db.ensureReady()
      const conds:string[] = []
      const args:any[] = []
      if(params.q){
        conds.push('(o.code LIKE ? OR v.plate LIKE ? OR c.name LIKE ?)')
        const f = `%${params.q}%`; args.push(f, f, f)
      }
      if(params.status && params.status !== 'todos'){
        conds.push('o.status = ?'); args.push(params.status)
      }
      if(params.from){ conds.push('date(o.opened_at) >= date(?)'); args.push(params.from) }
      if(params.to){ conds.push('date(o.opened_at) <= date(?)'); args.push(params.to) }
      const where = conds.length ? ('WHERE ' + conds.join(' AND ')) : ''
      return await sql.queryAll<any>(`
        SELECT o.*, c.name as customer_name, v.plate
        FROM orders o
        JOIN customers c ON c.id=o.customer_id
        JOIN vehicles v ON v.id=o.vehicle_id
        ${where}
        ORDER BY o.id DESC
      `, args)
    },
    async get(id:number){
      await db.ensureReady()
      const order = await sql.queryOne<any>('SELECT * FROM orders WHERE id=?',[id])
      const items = await sql.queryAll<any>('SELECT * FROM order_items WHERE order_id=? ORDER BY id',[id])
      const payments = await sql.queryAll<any>('SELECT * FROM payments WHERE order_id=? ORDER BY id',[id])
      const customer = await sql.queryOne<any>('SELECT * FROM customers WHERE id=?',[order.customer_id])
      const vehicle = await sql.queryOne<any>('SELECT * FROM vehicles WHERE id=?',[order.vehicle_id])
      return { order, items, payments, customer, vehicle }
    },
    async _nextCode(){
      await db.ensureReady()
      const year = dayjs().format('YYYY')
      const key = 'os_seq_' + year
      const cur = await sql.queryOne<any>('SELECT value FROM settings WHERE key=?',[key])
      let n = cur ? parseInt(cur.value,10) : 0
      n += 1
      await sql.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)',[key, String(n)])
      return `OS-${year}-${String(n).padStart(4,'0')}`
    },
    async openByPlate(plate:string, userId:number, mileage_in:number=0){
      await db.ensureReady()
      const v = await dal.vehicles.findByPlate(plate)
      if(!v) throw new Error('Veículo não encontrado')
      const code = await this._nextCode()
      await sql.exec(
        'INSERT INTO orders (code, customer_id, vehicle_id, status, payment_status, mileage_in, discount, surcharge, total, created_by) VALUES (?,?,?,?,?,?,0,0,0,?)',
        [code, v.customer_id, v.id, 'aberta', 'nao_pago', mileage_in, userId]
      )
      const row = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
      await dal.audit.log(userId, 'orders', row!.id, 'create', `Abertura por placa ${v.plate}`)
      return row!.id as number
    },
    async quickCreateWithNewCustomerVehicle(data:{customer:any, vehicle:any}, userId:number){
      await db.ensureReady()
      const customer_id = await dal.customers.create(data.customer)
      const vehicle_id = await dal.vehicles.create({ ...data.vehicle, customer_id })
      const code = await this._nextCode()
      await sql.exec(
        'INSERT INTO orders (code, customer_id, vehicle_id, status, payment_status, mileage_in, discount, surcharge, total, created_by) VALUES (?,?,?,?,?,?,0,0,0,?)',
        [code, customer_id, vehicle_id, 'aberta', 'nao_pago', data.vehicle.mileage||0, userId]
      )
      const row = await sql.queryOne<any>('SELECT last_insert_rowid() as id')
      await dal.audit.log(userId, 'orders', row!.id, 'create', 'Abertura com cadastro rápido')
      return row!.id as number
    },
    async update(id:number, data:any){
      await db.ensureReady()
      await sql.exec(
        'UPDATE orders SET customer_id=?, vehicle_id=?, status=?, mileage_in=?, mileage_out=?, discount=?, surcharge=?, notes=?, closed_at=? WHERE id=?',
        [data.customer_id, data.vehicle_id, data.status, data.mileage_in||0, data.mileage_out||null, data.discount||0, data.surcharge||0, data.notes||'', data.closed_at||null, id]
      )
    },
    async addItem(order_id:number, item:any){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO order_items (order_id, item_type, catalog_id, description, qty, unit_price, discount, total, technician_id) VALUES (?,?,?,?,?,?,?,?,?)',
        [order_id, item.item_type||'service', item.catalog_id||null, item.description, item.qty||1, item.unit_price||0, item.discount||0, 0, item.technician_id||null]
      )
    },
    async removeItem(id:number){
      await db.ensureReady()
      await sql.exec('DELETE FROM order_items WHERE id=?',[id])
    },
    async setStatus(id:number, status:string, userId:number, allowOverride:boolean=false, justification:string=''){
      await db.ensureReady()
      if(status === 'concluida'){
        const cnt = await sql.queryOne<any>('SELECT COUNT(*) as c FROM order_items WHERE order_id=?',[id])
        if(!cnt || cnt.c === 0) throw new Error('OS não pode ser concluída sem itens de serviço.')
      }
      if(status === 'entregue'){
        const o = await sql.queryOne<any>('SELECT payment_status FROM orders WHERE id=?',[id])
        if(o?.payment_status !== 'pago' && !allowOverride) throw new Error('Não é permitido entregar com pagamento pendente.')
        if(o?.payment_status !== 'pago' && allowOverride){
          await dal.audit.log(userId, 'orders', id, 'override_entrega', justification || '')
        }
      }
      await sql.exec(
        'UPDATE orders SET status=?, closed_at=CASE WHEN ? IN ("concluida","entregue","cancelada") THEN datetime("now") ELSE closed_at END WHERE id=?',
        [status, status, id]
      )
      await dal.audit.log(userId, 'orders', id, 'status', status)
    }
  },

  payments: {
    async add(p:{order_id:number, date:string, method:string, amount:number, status:string, notes?:string}){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO payments (order_id, date, method, amount, status, notes) VALUES (?,?,?,?,?,?)',
        [p.order_id, p.date, p.method, p.amount, p.status, p.notes||'']
      )
    },
    async list(params:any={}){
      await db.ensureReady()
      const conds:string[]=[]; const args:any[]=[]
      if(params.order_id){ conds.push('order_id=?'); args.push(params.order_id) }
      if(params.from){ conds.push('date(date)>=date(?)'); args.push(params.from) }
      if(params.to){ conds.push('date(date)<=date(?)'); args.push(params.to) }
      const where = conds.length?('WHERE '+conds.join(' AND ')):''
      return await sql.queryAll<any>(`SELECT * FROM payments ${where} ORDER BY date DESC, id DESC`, args)
    },
    async update(p:{id:number, date:string, method:string, amount:number, status:string, notes?:string}){
      await db.ensureReady()
      await sql.exec(
        'UPDATE payments SET date=?, method=?, amount=?, status=?, notes=? WHERE id=?',
        [p.date, p.method, p.amount, p.status, p.notes||'', p.id]
      )
    },
    async remove(id:number){
      await db.ensureReady()
      await sql.exec('DELETE FROM payments WHERE id=?', [id])
    }
  },

  expenses: {
    async add(e:{date:string, category:string, method:string, vendor?:string, description?:string, amount:number, notes?:string}){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO expenses (date, category, method, vendor, description, amount, notes) VALUES (?,?,?,?,?,?,?)',
        [e.date, e.category, e.method, e.vendor||'', e.description||'', e.amount, e.notes||'']
      )
    },
    async list(params:any={}){
      await db.ensureReady()
      const conds:string[]=[]; const args:any[]=[]
      if(params.from){ conds.push('date(date)>=date(?)'); args.push(params.from) }
      if(params.to){ conds.push('date(date)<=date(?)'); args.push(params.to) }
      if(params.category){ conds.push('category=?'); args.push(params.category) }
      const where = conds.length?('WHERE '+conds.join(' AND ')):''
      return await sql.queryAll<any>(`SELECT * FROM expenses ${where} ORDER BY date DESC, id DESC`, args)
    }
  },

  reports: {
    async kpis(from?:string, to?:string){
      await db.ensureReady()
      const k1 = await sql.queryOne<any>('SELECT COUNT(*) as c FROM orders WHERE status IN ("aberta","aprovada","em_execucao")')
      const k2 = await sql.queryOne<any>(
        'SELECT COUNT(*) as c FROM orders WHERE status IN ("concluida","entregue") AND date(opened_at) BETWEEN date(?) AND date(?)',
        [from||'0001-01-01', to||'4000-01-01']
      )
      const avg = await sql.queryOne<any>(
        'SELECT ROUND(AVG(total),2) as v FROM orders WHERE total>0 AND date(opened_at) BETWEEN date(?) AND date(?)',
        [from||'0001-01-01', to||'4000-01-01']
      )
      const rev = await sql.queryOne<any>(
        'SELECT COALESCE(SUM(CASE WHEN status="recebido" THEN amount ELSE 0 END),0) as v FROM payments WHERE date(date) BETWEEN date(?) AND date(?)',
        [from||'0001-01-01', to||'4000-01-01']
      )
      const exp = await sql.queryOne<any>(
        'SELECT COALESCE(SUM(amount),0) as v FROM expenses WHERE date(date) BETWEEN date(?) AND date(?)',
        [from||'0001-01-01', to||'4000-01-01']
      )
      return {
        open_orders: k1?.c||0,
        closed_orders: k2?.c||0,
        ticket_medio: avg?.v||0,
        receita: rev?.v||0,
        despesas: exp?.v||0
      }
    },
    async topServices(from?:string, to?:string){
      await db.ensureReady()
      return await sql.queryAll<any>(`
        SELECT description as servico, SUM(qty) as qtd, SUM(total) as valor
        FROM order_items oi
        JOIN orders o ON o.id=oi.order_id
        WHERE oi.item_type='service' AND date(o.opened_at) BETWEEN date(?) AND date(?)
        GROUP BY description ORDER BY valor DESC LIMIT 5
      `,[from||'0001-01-01', to||'4000-01-01'])
    },
    async cashFlowByDay(from:string, to:string){
      await db.ensureReady()
      const receipts = await sql.queryAll<any>(`
        SELECT date(date) as d, COALESCE(SUM(CASE WHEN status='recebido' THEN amount ELSE 0 END),0) as v
        FROM payments WHERE date(date) BETWEEN date(?) AND date(?)
        GROUP BY date(date)
      `, [from, to])
      const expenses = await sql.queryAll<any>(`
        SELECT date(date) as d, COALESCE(SUM(amount),0) as v
        FROM expenses WHERE date(date) BETWEEN date(?) AND date(?)
        GROUP BY date(date)
      `, [from, to])
      return { receipts, expenses }
    }
  },

  settings: {
    async getAll(){
      await db.ensureReady()
      const rows = await sql.queryAll<any>('SELECT key, value FROM settings')
      const obj:any = {}; for(const r of rows){ obj[r.key] = r.value }
      return obj
    },
    async set(key:string, value:string){
      await db.ensureReady()
      await sql.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)',[key,value])
    }
  },

  audit: {
    async log(user_id:number|null, entity:string, entity_id:number|null, action:string, details:string){
      await db.ensureReady()
      await sql.exec(
        'INSERT INTO audit_log (user_id, entity, entity_id, action, details) VALUES (?,?,?,?,?)',
        [user_id, entity, entity_id, action, details]
      )
    },
    async list(limit:number=100){
      await db.ensureReady()
      return await sql.queryAll<any>('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?', [limit])
    }
  }
}
