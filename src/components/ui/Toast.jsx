import React from 'react'
import { Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, Loader } from 'lucide-react'

// Custom Toast Container with improved styling
export function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          maxWidth: '400px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#1a1a1a',
            border: '1px solid rgba(204, 255, 51, 0.3)',
          },
          iconTheme: {
            primary: '#ccff33',
            secondary: '#1a1a1a',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#1a1a1a',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1a1a1a',
          },
        },
        loading: {
          style: {
            background: '#1a1a1a',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          },
        },
      }}
    />
  )
}

// Custom toast components for manual use
export function SuccessToast({ message, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(204, 255, 51, 0.2)' }}>
        <CheckCircle className="w-5 h-5" style={{ color: '#ccff33' }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: '#ffffff' }}>{message}</p>
        {description && <p className="text-sm mt-1" style={{ color: '#888888' }}>{description}</p>}
      </div>
    </div>
  )
}

export function ErrorToast({ message, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
        <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: '#ffffff' }}>{message}</p>
        {description && <p className="text-sm mt-1" style={{ color: '#888888' }}>{description}</p>}
      </div>
    </div>
  )
}

export function WarningToast({ message, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}>
        <AlertCircle className="w-5 h-5" style={{ color: '#fbbf24' }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: '#ffffff' }}>{message}</p>
        {description && <p className="text-sm mt-1" style={{ color: '#888888' }}>{description}</p>}
      </div>
    </div>
  )
}

export function InfoToast({ message, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
        <Info className="w-5 h-5" style={{ color: '#3b82f6' }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: '#ffffff' }}>{message}</p>
        {description && <p className="text-sm mt-1" style={{ color: '#888888' }}>{description}</p>}
      </div>
    </div>
  )
}

export function LoadingToast({ message }) {
  return (
    <div className="flex items-center gap-3">
      <Loader className="w-5 h-5 animate-spin" style={{ color: '#3b82f6' }} />
      <p className="font-medium" style={{ color: '#ffffff' }}>{message}</p>
    </div>
  )
}

export default CustomToaster
