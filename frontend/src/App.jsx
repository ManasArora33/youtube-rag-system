import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { useAuth } from './context/authContext'

function App() {
  const { loading } = useAuth()

  // 1. GLOBAL LOADING GUARD
  // This is the most important part of the 'Seamless Auth' fix.
  // It stops the app from rendering ANY routes while we check your login status.
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-500 text-sm font-medium tracking-widest uppercase">Verifying Session</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      {/* 2. PUBLIC ONLY ROUTES */}
      {/* If I am already logged in, PublicRoute will automatically move me to /chat */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* 3. PROTECTED ROUTES */}
      {/* If I am NOT logged in, ProtectedRoute will catch me and move me to /login */}
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
