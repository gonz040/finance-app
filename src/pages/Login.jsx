import { useEffect, useState } from 'react'
import { initAuth, requestToken } from '../services/authService'
import useStore from '../store/useStore'

export default function Login() {
  const setUser = useStore(s => s.setUser)
  const setToken = useStore(s => s.setToken)
  const loadFromSheets = useStore(s => s.loadFromSheets)
  const config = useStore(s => s.config)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gisReady, setGisReady] = useState(false)

  const BASE = import.meta.env.BASE_URL

  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true)
        clearInterval(check)
        initAuth(handleTokenReceived, handleError)
      }
    }, 200)
    return () => clearInterval(check)
  }, [])

  const handleTokenReceived = async (token, userInfo) => {
    setLoading(true)
    setError('')
    try {
      let role = 'agus'
      if (config.emailMeli && userInfo.email === config.emailMeli) role = 'meli'
      else if (config.emailAgus && userInfo.email === config.emailAgus) role = 'agus'

      setToken(token)
      setUser({ email: userInfo.email, name: userInfo.given_name || userInfo.name, picture: userInfo.picture, role })
      await loadFromSheets()
    } catch (err) {
      setError('Error al iniciar sesion: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleError = (err) => {
    setError('Error de autenticacion: ' + err)
    setLoading(false)
  }

  const handleLogin = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError('Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env')
      return
    }
    setLoading(true)
    setError('')
    requestToken()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F2E7DD' }}>

      {/* Foto hero */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden mb-6" style={{ height: 200 }}>
        <img src={`${BASE}pipitos.jpg`} alt="Pipitos" className="w-full h-full object-cover"
          style={{ objectPosition: '50% 65%' }}
          onError={e => { e.target.parentElement.style.backgroundColor = '#D9B99F' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #29242190, transparent 50%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <p className="text-white text-sm font-bold italic" style={{ textShadow: '0 1px 4px #00000060' }}>
            "Cuentas claras conservan a pipitos"
          </p>
        </div>
      </div>

      {/* Card login */}
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'white', border: '1px solid #D9B99F40', boxShadow: '0 4px 24px #A75F3715' }}>

        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#292421' }}>Pipitos Finance</h1>
          <p className="text-sm mt-1" style={{ color: '#A75F37' }}>Ingresa con tu cuenta de Google</p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#F2D6CE', color: '#A75F37' }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={!gisReady || loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold transition-colors"
          style={{ backgroundColor: 'white', border: '2px solid #D9B99F', color: '#292421' }}>
          {loading ? (
            <span className="text-sm">Iniciando sesion...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
                <path d="M6.3 14.7l7.1 5.2C15.1 16 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16 2 9.1 7.4 6.3 14.7z" fill="#FF3D00"/>
                <path d="M24 46c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.5C29.8 37 27 38 24 38c-5.7 0-10.6-3.1-11.8-7.5L5 36c2.9 7.4 9.8 10 19 10z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.6 2.7-2.3 5-4.8 6.5l6.6 5.5C42 37.3 46 31.5 46 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>

        {!gisReady && <p className="text-center text-xs" style={{ color: '#D9B99F' }}>Cargando autenticacion...</p>}
      </div>

      <p className="mt-6 text-xs text-center max-w-xs" style={{ color: '#CA8E82' }}>
        Los datos se guardan en tu Google Sheet personal. No almacenamos nada en servidores propios.
      </p>
    </div>
  )
}
