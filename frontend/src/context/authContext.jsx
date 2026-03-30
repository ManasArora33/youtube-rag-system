import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const checkAuth = async () => {
        try {
            const response = await api.get('/users/me')
            setUser(response.data.user)
            setIsAuthenticated(true)
        } catch (err) {
            setUser(null)
            setIsAuthenticated(false)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        const response = await api.post('/users/login', { email, password })
        setUser(response.data.user)
        setIsAuthenticated(true)
        return response.data
    }

    const logout = async () => {
        try {
            await api.post('/users/logout')
        } catch (err) {
            // Ignore logout errors
        }
        setUser(null)
        setIsAuthenticated(false)
    }

    useEffect(() => {
        checkAuth()
    }, [])

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}