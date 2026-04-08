import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

export default function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    // Show loader while verifying session
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

    if (isAuthenticated) {
        // If they are already logged in, redirect them to the chat page
        return <Navigate to="/chat" replace />
    }

    return children
}
