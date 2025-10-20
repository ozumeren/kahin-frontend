import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      toast.error('Şifreler eşleşmiyor')
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }

    setIsLoading(true)

    try {
      await register(formData.username, formData.email, formData.password)
      toast.success('Hesabınız başarıyla oluşturuldu!')
      navigate('/')
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Kayıt başarısız. Lütfen tekrar deneyin.'
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

  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const levels = [
      { strength: 0, text: '', color: '' },
      { strength: 1, text: 'Çok Zayıf', color: '#ef4444' },
      { strength: 2, text: 'Zayıf', color: '#f97316' },
      { strength: 3, text: 'Orta', color: '#eab308' },
      { strength: 4, text: 'İyi', color: '#3b82f6' },
      { strength: 5, text: 'Güçlü', color: '#ccff33' },
    ]

    return levels[strength]
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <TrendingUp className="w-8 h-8" style={{ color: '#ccff33' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#EEFFDD' }}>Hesap Oluştur</h1>
          <p style={{ color: '#EEFFDD', opacity: 0.7 }}>Hemen başlayın ve tahminlerinizi yapın</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: '#111111', border: '1px solid #555555' }}>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#EEFFDD' }}>
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input pl-11"
                  placeholder="kullaniciadi"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#EEFFDD' }}>
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-11"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#EEFFDD' }}>
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pl-11 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: '#EEFFDD', opacity: 0.5 }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#555555'
                        }}
                      />
                    ))}
                  </div>
                  {passwordStrength.text && (
                    <p className="text-xs" style={{ color: '#EEFFDD', opacity: 0.7 }}>
                      Şifre gücü: <span className="font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.text}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#EEFFDD' }}>
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#EEFFDD', opacity: 0.5 }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input pl-11 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: '#EEFFDD', opacity: 0.5 }}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4" style={{ color: '#ccff33' }} />
                      <span className="text-xs" style={{ color: '#ccff33' }}>Şifreler eşleşiyor</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      <span className="text-xs" style={{ color: '#ef4444' }}>Şifreler eşleşmiyor</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded"
                style={{ backgroundColor: '#555555', borderColor: '#555555' }}
              />
              <label className="ml-2 text-sm" style={{ color: '#EEFFDD', opacity: 0.7 }}>
                <a href="#" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#ccff33' }}>
                  Kullanım Koşulları
                </a>{' '}
                ve{' '}
                <a href="#" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#ccff33' }}>
                  Gizlilik Politikası
                </a>
                'nı okudum ve kabul ediyorum
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#EEFFDD' }}></div>
                  <span>Hesap oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Hesap Oluştur</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid #555555' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: '#111111', color: '#EEFFDD', opacity: 0.5 }}>veya</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p style={{ color: '#EEFFDD', opacity: 0.7 }}>
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#ccff33' }}>
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}