import React, { useState, useContext } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { SocketLoginContext } from '../context/SocketLoginContext'

const SignUp = () => {
  const [isSignUp, setIsSignUp] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isSignUp ? '/api/user/register' : '/api/user/login'
      const payload = isSignUp ? { username, email, password } : { email, password }
      
      console.log(endpoint, payload)
      const response = await axios.post(endpoint, payload)
      
      if (isSignUp) {
        alert('Registration successful! Please login.')
        setIsSignUp(false)
    
        
      } else {
        sessionStorage.setItem('token', response.data.token)
        sessionStorage.setItem('user', JSON.stringify(response.data.user))

        navigate('/chat-client') 

      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl  shadow-2xl shadow-purple-00 p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full outline-none px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 outline-none py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 outline-none rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              minLength="6"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
      
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          {isSignUp ? 'Already have an account? ' : 'Need an account? '}
          
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
          >
            {isSignUp ? 'Login instead' : 'Sign up here'}
          </button>
         
        </p>
      </div>
    </div>
  )
}

export default SignUp