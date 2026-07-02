'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, RefreshCw } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate authentication check
    setTimeout(() => {
      if (email === 'admin@ficomana.com' && password === 'admin123') {
        localStorage.setItem('ficomana_admin_session', JSON.stringify({
          email,
          role: 'administrator',
          token: 'mock-session-token-' + Math.floor(Math.random() * 10000)
        }))
        router.push('/admin/dashboard')
      } else {
        setError('Invalid email address or password.')
        setLoading(false)
      }
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-200 shadow-xl p-8 md:p-10"
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-primary">FICO MANA</h1>
          <p className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">Console Login</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3.5 text-xs font-semibold uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ficomana.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none p-3.5 pl-11 text-xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none p-3.5 pl-11 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[#03008F] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              'Login to Console'
            )}
          </button>
        </form>

        {/* Hint Box */}
        <div className="bg-blue-50 border border-blue-100 p-4 mt-8 text-[11px] leading-relaxed text-blue-800">
          <p className="font-bold uppercase tracking-wider mb-1">Developer Notice:</p>
          <p>Login with default credentials: <br />
            <strong>admin@ficomana.com</strong> / <strong>admin123</strong>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
