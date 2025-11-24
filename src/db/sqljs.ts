import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set } from 'idb-keyval'

export type SQLDatabase = Awaited<ReturnType<typeof initDb>>

const DB_NAME = 'autoops.sqlite'

let SQL: any
let dbInstance: any
let isOpfs = false
let rootDir: any

async function openFromOPFS(): Promise<Uint8Array|null> {
  if(!('storage' in navigator) || !('getDirectory' in (navigator as any).storage)) return null
  // @ts-ignore
  const dir = await (navigator as any).storage.getDirectory()
  rootDir = dir
  try {
    const handle = await dir.getFileHandle(DB_NAME, { create: false })
    const file = await handle.getFile()
    const buf = new Uint8Array(await file.arrayBuffer())
    isOpfs = true
    return buf
  } catch {
    isOpfs = true
    return null
  }
}

async function saveToOPFS(bytes: Uint8Array){
  if(!isOpfs || !rootDir) return
  const handle = await rootDir.getFileHandle(DB_NAME, { create: true })
  const writable = await handle.createWritable()
  await writable.write(bytes)
  await writable.close()
}

async function openFromIDB(): Promise<Uint8Array|null> {
  const buf = await get(DB_NAME)
  return buf || null
}

async function saveToIDB(bytes: Uint8Array){
  await set(DB_NAME, bytes)
}

let saveTimer: any = null
async function persistentSave(){
  if(!dbInstance) return
  const data = dbInstance.export()
  const bytes = new Uint8Array(data)
  if(isOpfs) await saveToOPFS(bytes); else await saveToIDB(bytes)
}

function scheduleSave(){
  if(saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(persistentSave, 400)
}

export async function initDb(){
  if(dbInstance) return dbInstance
  SQL = await initSqlJs({ locateFile: () => wasmUrl })
  let bytes = await openFromOPFS()
  if(!bytes){
    bytes = await openFromIDB()
  }
  dbInstance = new SQL.Database(bytes || undefined)
  dbInstance.exec('PRAGMA foreign_keys = ON;')
  await persistentSave()
  return dbInstance
}

export async function exec(sql: string, params: any[] = []){
  if(!dbInstance) await initDb()
  if (!params || params.length === 0) {
    dbInstance.exec(sql) // aceita múltiplas instruções
  } else {
    const stmt = dbInstance.prepare(sql)
    stmt.bind(params)
    while(stmt.step()){}
    stmt.free()
  }
  scheduleSave()
}

export async function queryAll<T=any>(sql: string, params: any[] = []): Promise<T[]>{
  if(!dbInstance) await initDb()
  const stmt = dbInstance.prepare(sql)
  stmt.bind(params)
  const rows: any[] = []
  while(stmt.step()){
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows as T[]
}

export async function queryOne<T=any>(sql: string, params: any[] = []): Promise<T|null>{
  const rows = await queryAll<T>(sql, params)
  return rows.length ? rows[0] : null
}

export async function transaction<T>(fn: ()=>Promise<T>): Promise<T>{
  if(!dbInstance) await initDb()
  dbInstance.exec('BEGIN')
  try {
    const res = await fn()
    dbInstance.exec('COMMIT')
    scheduleSave()
    return res
  } catch(e){
    dbInstance.exec('ROLLBACK')
    throw e
  }
}

export async function exportBytes(): Promise<Uint8Array>{
  if(!dbInstance) await initDb()
  const data = dbInstance.export()
  return new Uint8Array(data)
}

export async function importBytes(bytes: Uint8Array){
  if(dbInstance) dbInstance.close()
  dbInstance = new SQL.Database(bytes)
  await persistentSave()
}

export async function ensureOpfs(): Promise<boolean>{
  await initDb()
  return isOpfs
}
