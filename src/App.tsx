import React, { Suspense } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { Wrench, Gauge, Receipt, Users, Gear, Car, CurrencyDollar, Note, List, ChartLineUp } from 'phosphor-react'

const NavItem = ({to, icon, label}:{to:string, icon:React.ReactNode, label:string}) => {
  const loc = useLocation()
  const active = loc.pathname === to || loc.pathname.startsWith(to + '/')
  return (
    <Link to={to} className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-800 ${active?'bg-gray-800 text-yellow-400':'text-gray-200'}`}>
      {icon}<span>{label}</span>
    </Link>
  )
}

export default function App(){
  const user = useAuthStore(s=>s.user)
  const logout = useAuthStore(s=>s.logout)
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r border-gray-800 p-4 flex flex-col gap-3 bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded bg-yellow-400 flex items-center justify-center text-gray-900 font-black">OS</div>
          <div>
            <div className="font-bold">Oficina PWA</div>
            <div className="text-xs text-gray-400">100% local</div>
          </div>
        </div>
        <NavItem to="/" icon={<Gauge size={18}/>} label="Dashboard" />
        <NavItem to="/os" icon={<Wrench size={18}/>} label="Ordens de Serviço" />
        <NavItem to="/clientes" icon={<Users size={18}/>} label="Clientes" />
        <NavItem to="/veiculos" icon={<Car size={18}/>} label="Veículos" />
        <NavItem to="/servicos" icon={<List size={18}/>} label="Serviços" />
        <div className="mt-2 text-xs text-gray-400 px-3">Financeiro</div>
        <NavItem to="/financeiro/receitas" icon={<CurrencyDollar size={18}/>} label="Receitas" />
        <NavItem to="/financeiro/despesas" icon={<Receipt size={18}/>} label="Despesas" />
        <NavItem to="/financeiro/fluxo" icon={<ChartLineUp size={18}/>} label="Fluxo de Caixa" />
        <div className="mt-2 text-xs text-gray-400 px-3">Outros</div>
        <NavItem to="/relatorios" icon={<Note size={18}/>} label="Relatórios" />
        <NavItem to="/usuarios" icon={<Users size={18}/>} label="Usuários" />
        <NavItem to="/settings" icon={<Gear size={18}/>} label="Configurações" />
        <div className="mt-auto pt-4 border-t border-gray-800 text-xs text-gray-400">
          {user ? (
            <div className="flex items-center justify-between">
              <div>{user.display_name || user.username} <span className="text-gray-500">({user.role})</span></div>
              <button className="text-yellow-400 hover:underline" onClick={logout}>Sair</button>
            </div>
          ) : <Link to="/login" className="text-yellow-400">Entrar</Link>}
        </div>
      </aside>
      <main className="p-6">
        <Suspense fallback={<div>Carregando…</div>}>
          <Outlet/>
        </Suspense>
      </main>
    </div>
  )
}
