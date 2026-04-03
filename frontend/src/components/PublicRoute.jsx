import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

export default function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return null
    }

    if (isAuthenticated) {
        // If they are already logged in, redirect them to the chat page
        return <Navigate to="/chat" replace />
    }

    return children
}
