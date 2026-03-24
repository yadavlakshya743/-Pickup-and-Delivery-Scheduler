import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// In a real app, this should be in .env (e.g., import.meta.env.VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
