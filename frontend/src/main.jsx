import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
            duration: 4000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
