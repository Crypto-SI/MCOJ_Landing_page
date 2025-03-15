'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // This is a simple authentication function
  // In a real app, you'd want to implement proper authentication with JWT or sessions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simple authentication - in production, you'd use a proper auth system
    // Here we're just checking for demo credentials
    if (username === 'admin' && password === 'admin123') {
      // Store authentication status in localStorage (not recommended for production)
      localStorage.setItem('mcoj_admin_authenticated', 'true')
      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } else {
      setError('Invalid username or password')
    }
    
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
      <div className="bg-black p-8 rounded-lg shadow-lg w-full max-w-md text-yellow-400">
        <div className="flex justify-center mb-6">
          {/* Replace with your actual logo */}
          <div className="relative w-24 h-24">
            <Image 
              src="/brand/OJ logo.jpeg" 
              alt="MC OJ Logo" 
              fill
              className="object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-yellow-400">Admin Login</h1>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-yellow-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-yellow-400 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-800 text-yellow-400"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-yellow-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-800 text-yellow-400"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
} 