import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'  // ✅ Import ekle
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import './styles/chart-animations.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1D1D1F',
                color: '#EEFFDD',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
                border: '1px solid #555555',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#ccff33',
                  secondary: '#1D1D1F',
                },
                style: {
                  background: '#1D1D1F',
                  color: '#EEFFDD',
                  border: '1px solid #ccff33',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF0000',
                  secondary: '#1D1D1F',
                },
                style: {
                  background: '#1D1D1F',
                  color: '#EEFFDD',
                  border: '1px solid #FF0000',
                },
              },
            }}
          />  {/* ✅ YENİ - Toaster component */}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)