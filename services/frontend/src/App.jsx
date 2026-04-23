import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FoodLog from './pages/FoodLog'
import Alerts from './pages/Alerts'
import { Onboarding } from './pages/Onboarding'

function ProtectedRoute({ children, requireOnboard = true }) {
  const { token, targets } = useAuth()
  const location = useLocation()
  
  if (!token) return <Navigate to="/login" />
  
  // If they need to onboard but haven't
  if (requireOnboard && targets && targets.height === null) {
    if (location.pathname !== '/onboard') {
      return <Navigate to="/onboard" replace />
    }
  }

  // If they are onboarded but try to access /onboard
  if (!requireOnboard && targets && targets.height !== null) {
      return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { token } = useAuth()

  return (
    <div className="app">
      {token && <Navbar />}
      <main className={token ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboard" element={<ProtectedRoute requireOnboard={false}><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/food-log" element={<ProtectedRoute><FoodLog /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
