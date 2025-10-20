import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      toast.success('Başarıyla giriş yapıldı!')
      navigate(from, { replace: true })
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Giriş başarısız. Lütfen tekrar deneyin.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ backgroundColor: '#111111' }}
    >
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
            <img 
              src="https://i.ibb.co/qL5cd5C1/Logo.png" 
              alt="Kahinmarket Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                // Eğer logo yüklenemezse, fallback icon göster
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div 
              className="w-16 h-16 rounded-2xl items-center justify-center transition-all hidden"
              style={{ backgroundColor: '#ccff33', display: 'none' }}
            >
              <TrendingUp className="w-8 h-8" style={{ color: '#111111' }} />
            </div>
          </div>
          <h1 
            className="text-3xl font-bold mb-2 font-sans"
            style={{ color: '#ffffff' }}
          >
            Hoş Geldiniz
          </h1>
          <p style={{ color: '#cccccc' }}>Hesabınıza giriş yapın</p>
        </div>

        {/* Form Card */}
        <div 
          className="rounded-2xl shadow-xl p-8"
          style={{ backgroundColor: '#222222', border: '1px solid #333333' }}
        >
          {/* Error Alert */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF0000' }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#FF0000' }}>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2 font-sans"
                style={{ color: '#ffffff' }}
              >
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all font-sans"
                  style={{ 
                    backgroundColor: '#333333',
                    border: '1px solid #444444',
                    color: '#ffffff'
                  }}
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2 font-sans"
                style={{ color: '#ffffff' }}
              >
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#888888' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl focus:outline-none transition-all font-sans"
                  style={{ 
                    backgroundColor: '#333333',
                    border: '1px solid #444444',
                    color: '#ffffff'
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:brightness-110 transition-all"
                  style={{ color: '#888888' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded focus:outline-none"
                  style={{ 
                    backgroundColor: '#333333',
                    border: '1px solid #444444',
                    accentColor: '#ccff33'
                  }}
                />
                <span className="ml-2 font-sans" style={{ color: '#cccccc' }}>Beni hatırla</span>
              </label>
              <a 
                href="#" 
                className="font-medium hover:brightness-110 transition-all font-sans"
                style={{ color: '#ccff33' }}
              >
                Şifremi unuttum
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 font-sans"
              style={{ 
                backgroundColor: '#ccff33',
                color: '#111111'
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#111111' }}></div>
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#444444' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span 
                className="px-4 font-sans"
                style={{ backgroundColor: '#222222', color: '#888888' }}
              >
                veya
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p style={{ color: '#cccccc' }} className="font-sans">
              Hesabınız yok mu?{' '}
              <Link 
                to="/register" 
                className="font-medium hover:brightness-110 transition-all font-sans"
                style={{ color: '#ccff33' }}
              >
                Kayıt olun
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6 font-sans" style={{ color: '#888888' }}>
          Giriş yaparak{' '}
          <a 
            href="#" 
            className="hover:brightness-110 transition-all font-sans"
            style={{ color: '#ccff33' }}
          >
            Kullanım Koşulları
          </a>{' '}
          ve{' '}
          <a 
            href="#" 
            className="hover:brightness-110 transition-all font-sans"
            style={{ color: '#ccff33' }}
          >
            Gizlilik Politikası
          </a>
          'nı kabul etmiş olursunuz
        </p>
      </div>
    </div>
  )
}