import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom' // Import BrowserRouter
import './index.css'
import App from './App.jsx'

const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
    scope: "openid profile email"
  },
  cacheLocation: 'localstorage', // Store tokens in localStorage
  useRefreshTokens: true, // Enable refresh tokens for better security
  useRefreshTokensFallback: true // Fallback for browsers that don't support refresh tokens
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* Wrap Auth0Provider with BrowserRouter */}
      <Auth0Provider {...auth0Config}>
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
)
