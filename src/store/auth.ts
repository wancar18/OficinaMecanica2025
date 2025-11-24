import { create } from 'zustand'
import bcrypt from 'bcryptjs'
import { db, dal } from '../db/dal'

export type Role = 'admin'|'atendente'|'mecanico'

export interface User {
  id: number
  username: string
  display_name?: string
  role: Role
  must_change_password: number
  active: number
  created_at: string
}

interface AuthState {
  user: User|null
  lastActivityAt?: number
  login: (username:string, password:string)=>Promise<boolean>
  logout: ()=>void
  changePassword: (userId:number, newPass:string)=>Promise<void>
  touch: ()=>void
}

const STORAGE_KEY = 'auth_user'

// Reidrata usuário da sessão (se houver)
const initialUser: User|null = (() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as User : null
  } catch {
    return null
  }
})()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,

  async login(username, password){
    await db.ensureReady()
    const u = await dal.users.findByUsername(username)
    if(!u || !u.active) return false

    const ok = bcrypt.compareSync(password, u.password_hash)
    if(!ok) return false

    const user: User = {
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      must_change_password: u.must_change_password,
      active: u.active,
      created_at: u.created_at
    }

    set({ user, lastActivityAt: Date.now() })
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user)) } catch {}

    await dal.audit.log(u.id, 'auth', u.id, 'login', '')
    return true
  },

  logout(){
    const u = get().user
    if(u) dal.audit.log(u.id, 'auth', u.id, 'logout', '')
    set({ user: null })
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
  },

  async changePassword(userId, newPass){
    const hash = bcrypt.hashSync(newPass, 10)
    await dal.users.updatePassword(userId, hash, 0)
    const u = await dal.users.get(userId)

    const user: User|null = u ? {
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      must_change_password: u.must_change_password,
      active: u.active,
      created_at: u.created_at
    } : null

    set({ user })
    try {
      if(user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
  },

  touch(){ set({ lastActivityAt: Date.now() }) }
}))

// Persiste mudanças do usuário automaticamente (belt & suspenders)
try {
  useAuthStore.subscribe(s => {
    try {
      if (s.user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s.user))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
  })
} catch {}

// Logout por inatividade (15 min)
let timer: number|undefined
document.addEventListener('visibilitychange', () => useAuthStore.getState().touch())
;['click','keydown','mousemove','scroll','touchstart'].forEach(evt => {
  window.addEventListener(evt, () => {
    const s = useAuthStore.getState()
    if(!s.user) return
    s.touch()
    if(timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => useAuthStore.getState().logout(), 15*60*1000)
  }, { passive: true })
})
