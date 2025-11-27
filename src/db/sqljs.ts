// Este arquivo agora é um adaptador.
// Se estiver no Electron, usa o IPC. Se não, lança erro ou fallback.

// Interface para o TypeScript entender o objeto window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      exec: (sql: string, params?: any[]) => Promise<any>
      queryAll: (sql: string, params?: any[]) => Promise<any[]>
      queryOne: (sql: string, params?: any[]) => Promise<any>
    }
  }
}

export const db = {
  // Função dummy para compatibilidade, no Electron o banco já "nasce" pronto no main.js
  async ensureReady() { return true } 
}

export async function initDb() {
  // No Electron, o banco é iniciado pelo processo Main
  return true 
}

export async function exec(sql: string, params: any[] = []) {
  if (window.electronAPI) {
    // Redireciona para o arquivo físico via Electron
    return await window.electronAPI.exec(sql, params)
  } else {
    console.error("Erro: Esta versão requer o aplicativo Desktop (Electron).")
  }
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (window.electronAPI) {
    return await window.electronAPI.queryAll(sql, params)
  }
  return []
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (window.electronAPI) {
    const res = await window.electronAPI.queryOne(sql, params)
    return res || null
  }
  return null
}

// Transações no SQLite são apenas comandos SQL normais
export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  await exec('BEGIN TRANSACTION')
  try {
    const res = await fn()
    await exec('COMMIT')
    return res
  } catch (e) {
    await exec('ROLLBACK')
    throw e
  }
}

// Funções de exportação/importação não são mais necessárias da mesma forma
// pois o arquivo .db já está no disco.
export async function exportBytes(): Promise<Uint8Array> { return new Uint8Array() }
export async function importBytes(bytes: Uint8Array) { alert('Importação via arquivo físico.') }
export async function ensureOpfs() { return true }