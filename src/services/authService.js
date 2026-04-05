/**
 * authService.js
 * Maneja Google OAuth 2.0 usando Google Identity Services (GIS)
 * Scope: spreadsheets (lectura/escritura) + userinfo para identificar al usuario
 */

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

let tokenClient = null
let currentToken = null
let tokenExpiresAt = null

// Inicializa el cliente de OAuth. Llamar una vez que el script de GIS está cargado.
export function initAuth(onTokenReceived, onError) {
  if (!window.google) {
    onError('Google Identity Services no cargó. Revisá tu conexión.')
    return
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: async (response) => {
      if (response.error) {
        onError(response.error)
        return
      }
      currentToken = response.access_token
      // El token dura 3600 segundos (1 hora)
      tokenExpiresAt = Date.now() + (response.expires_in - 60) * 1000

      try {
        const userInfo = await fetchUserInfo(currentToken)
        onTokenReceived(currentToken, userInfo)
      } catch (err) {
        onError('Error al obtener datos del usuario: ' + err.message)
      }
    },
    error_callback: (err) => {
      onError(err.type || 'Error de autenticación')
    }
  })
}

// Solicita el token al usuario (abre popup de Google)
export function requestToken() {
  if (!tokenClient) {
    throw new Error('Auth no inicializado. Llamá initAuth primero.')
  }
  tokenClient.requestAccessToken({ prompt: 'consent' })
}

// Intenta refrescar silenciosamente sin popup
export function refreshTokenSilent() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Auth no inicializado'))
      return
    }
    // Guardar callback original y reemplazarlo temporalmente
    tokenClient.requestAccessToken({ prompt: '' })
    resolve()
  })
}

// Obtiene el token actual, null si expiró
export function getToken() {
  if (!currentToken || Date.now() > tokenExpiresAt) {
    return null
  }
  return currentToken
}

// Verifica si el token está vigente
export function isTokenValid() {
  return currentToken !== null && Date.now() < tokenExpiresAt
}

// Revoca el token y limpia el estado
export function logout() {
  if (currentToken) {
    window.google?.accounts.oauth2.revoke(currentToken)
  }
  currentToken = null
  tokenExpiresAt = null
  // Limpiar la cuenta de Google seleccionada
  window.google?.accounts.id.disableAutoSelect()
}

// Obtiene el perfil del usuario con el access token
async function fetchUserInfo(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al obtener userinfo')
  return res.json()
  // Retorna: { id, email, name, picture, given_name, family_name }
}
