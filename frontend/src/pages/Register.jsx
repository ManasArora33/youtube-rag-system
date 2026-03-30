import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/api'
import { useAuth } from '../context/authContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat')
    }
  }, [isAuthenticated, navigate])

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/users/register', { name, email, password })
      if (response.data.user) {
        navigate('/chat')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <style>{`
        .auth-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .auth-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          outline: none;
        }
        .btn-primary {
          background: white;
          color: black;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.15);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-lg font-semibold tracking-tight">YT Chat AI</Link>
        </div>

        <div className="auth-card rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-2 text-center tracking-tight">Create account</h1>
          <p className="text-neutral-500 text-sm text-center mb-8">Start chatting with YouTube videos</p>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input w-full px-4 py-3 rounded-md text-white placeholder-neutral-600"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input w-full px-4 py-3 rounded-md text-white placeholder-neutral-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full px-4 py-3 rounded-md text-white placeholder-neutral-600"
                placeholder="Create a password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-md text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-neutral-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-400 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
