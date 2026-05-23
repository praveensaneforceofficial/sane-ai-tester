import React, { useEffect, useState } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import SprintBoard from './pages/SprintBoard'
import Agents from './pages/Agents'
import Analytics from './pages/Analytics'
import LoginPage from './pages/LoginPage'
import Reports from './pages/Reports'
import { useUIStore } from './store/uiStore'
import { useWorkerStore } from './store/workerStore'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const { activeTab, setActiveTab } = useUIStore()
  const { fetchWorkers } = useWorkerStore()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [isConnected, setIsConnected] = useState(false)
  
  const { isConnected: wsConnected } = useWebSocket()
  
  useEffect(() => {
    setIsConnected(wsConnected)
    fetchWorkers()
  }, [wsConnected, fetchWorkers])
  
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'projects':
        return <Projects />
      case 'sprint':
        return <SprintBoard />
      case 'agents':
        return <Agents />
      case 'analytics':
        return <Analytics />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }
  
  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right">
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex items-center justify-center p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-[10px] focus:outline-none ml-1.5 cursor-pointer"
                    style={{ width: 18, height: 18, minWidth: 18, border: 'none', background: 'none' }}
                    aria-label="Dismiss toast"
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header isConnected={isConnected} user={user} onLogout={() => {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          setUser(null)
        }} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App