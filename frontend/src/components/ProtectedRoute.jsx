import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // While checking auth, we show nothing (or handled by App.jsx)
    if (loading) {
        return null 
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them back after they log in.
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}
