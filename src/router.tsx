import React, { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import { useAuthStore } from './store/auth'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const OrdersList = lazy(() => import('./pages/Orders/OrderList'))
const OrderDetail = lazy(() => import('./pages/Orders/OrderDetail'))
const CustomersList = lazy(() => import('./pages/Customers/CustomerList'))
const VehiclesList = lazy(() => import('./pages/Vehicles/VehicleList'))
const ServicesList = lazy(() => import('./pages/Services/ServiceList'))
const ReceiptsList = lazy(() => import('./pages/Finance/ReceiptsList'))
const ExpensesList = lazy(() => import('./pages/Finance/ExpensesList'))
const CashFlow = lazy(() => import('./pages/Finance/CashFlow'))
const Reports = lazy(() => import('./pages/Reports/Reports'))
const UsersList = lazy(() => import('./pages/Users/UserList'))
const Settings = lazy(() => import('./pages/Settings/Settings'))

function Private({ children }:{children: React.ReactNode}) {
  const user = useAuthStore(s=>s.user)
  if(!user) return <Navigate to="/login" replace />
  if(user.must_change_password && location.pathname !== '/settings'){
    return <Navigate to="/settings?changePassword=1" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login/> },
  {
    path: '/',
    element: <App/>,
    children: [
      { index: true, element: <Private><Dashboard/></Private> },
      { path: 'os', element: <Private><OrdersList/></Private> },
      { path: 'os/:id', element: <Private><OrderDetail/></Private> },
      { path: 'clientes', element: <Private><CustomersList/></Private> },
      { path: 'veiculos', element: <Private><VehiclesList/></Private> },
      { path: 'servicos', element: <Private><ServicesList/></Private> },
      { path: 'financeiro/receitas', element: <Private><ReceiptsList/></Private> },
      { path: 'financeiro/despesas', element: <Private><ExpensesList/></Private> },
      { path: 'financeiro/fluxo', element: <Private><CashFlow/></Private> },
      { path: 'relatorios', element: <Private><Reports/></Private> },
      { path: 'usuarios', element: <Private><UsersList/></Private> },
      { path: 'settings', element: <Private><Settings/></Private> },
    ]
  }
])
