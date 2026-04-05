import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MisGastos from './pages/MisGastos'
import Casita from './pages/Casita'
import Config from './pages/Config'
import { initAuth } from './services/authService'
import { initSheets } from './services/sheetsService'

function AppLayout() {
  return (
    <div className="max-w-md mx-auto relative min-h-screen">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos" element={<MisGastos />} />
        <Route path="/casita" element={<Casita />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <NavBar />
    </div>
  )
}

export default function App() {
  const user = useStore(s => s.user)
  const token = useStore(s => s.token)
  const config = useStore(s => s.config)
  const syncPending = useStore(s => s.syncPending)
  const pendingChanges = useStore(s => s.pendingChanges)
  const setSyncStatus = useStore(s => s.setSyncStatus)

  // Inicializar Sheets si hay token
  useEffect(() => {
    if (token && config.spreadsheetId) {
      initSheets(token, config.spreadsheetId)
    }
  }, [token, config.spreadsheetId])

  // Listener de conectividad: sync automático al reconectar
  useEffect(() => {
    const handleOnline = async () => {
      if (pendingChanges.length > 0) {
        await syncPending()
      }
    }
    const handleOffline = () => {
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingChanges, syncPending, setSyncStatus])

  // Sync periódico cada 5 minutos si hay cambios pendientes
  useEffect(() => {
    if (!user || !token) return
    const interval = setInterval(() => {
      if (pendingChanges.length > 0 && navigator.onLine) {
        syncPending()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, token, pendingChanges, syncPending])

  // Si no hay usuario, mostrar Login
  if (!user || !token) {
    return (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Login />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppLayout />
    </BrowserRouter>
  )
}
