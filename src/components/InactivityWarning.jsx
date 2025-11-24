// src/components/InactivityWarning.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function InactivityWarning() {
  const { showInactivityWarning, extendSession, logout, inactivityWarning } = useAuth()
  const [remainingTime, setRemainingTime] = useState(Math.floor(inactivityWarning / 1000))

  // Geri sayım
  useEffect(() => {
    if (!showInactivityWarning) {
      setRemainingTime(Math.floor(inactivityWarning / 1000))
      return
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showInactivityWarning, inactivityWarning])

  if (!showInactivityWarning) return null

  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-yellow-500/30 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          Oturum Süresi Dolmak Üzere
        </h3>

        {/* Message */}
        <p className="text-gray-400 text-center mb-4">
          Uzun süredir aktif olmadığınız için güvenliğiniz açısından oturumunuz
          kapatılacak.
        </p>

        {/* Countdown */}
        <div className="bg-[#0f0f1a] rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Kalan Süre</p>
          <p className="text-3xl font-mono font-bold text-yellow-500">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={logout}
            className="flex-1 px-4 py-3 bg-[#0f0f1a] text-gray-400 rounded-xl
                     hover:bg-[#252542] transition-colors font-medium"
          >
            Çıkış Yap
          </button>
          <button
            onClick={extendSession}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600
                     text-white rounded-xl hover:from-green-600 hover:to-emerald-700
                     transition-all font-medium"
          >
            Oturumu Uzat
          </button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-600 text-center mt-4">
          Güvenliğiniz için inaktivite sonrası otomatik çıkış yapılmaktadır.
        </p>
      </div>
    </div>
  )
}
