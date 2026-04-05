# 💰 Pipitos Finance

App mobile-first para gestión de finanzas personales y compartidas. Usa Google Sheets como backend y se puede instalar como PWA en el celular.

## Setup inicial

### 1. Clonar y instalar

```bash
git clone https://github.com/TU_USUARIO/pipitos-finance.git
cd pipitos-finance
npm install
```

### 2. Crear Google Cloud Project y OAuth Client

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (ej: "Pipitos Finance")
3. Habilitar la **Google Sheets API**:
   - APIs & Services → Enable APIs → buscar "Google Sheets API" → Habilitar
4. Crear credenciales OAuth:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: Pipitos Finance
   - Authorized JavaScript origins:
     - `http://localhost:5173` (para desarrollo)
     - `https://TU_USUARIO.github.io` (para producción)
   - Copiar el **Client ID**

### 3. Crear el Google Sheet

1. Crear un Google Sheet en blanco en [sheets.google.com](https://sheets.google.com)
2. Compartirlo con el email de Meli (permiso de edición)
3. Copiar el **Spreadsheet ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus datos:
```
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=tu-spreadsheet-id
```

### 5. Correr en desarrollo

```bash
npm run dev
```

### 6. Primera vez en la app

1. Loguearse con la cuenta de Agus
2. Ir a **Config** e ingresar:
   - Sueldos de ambos
   - Emails de Agus y Meli (para identificar quién es quién al loguearse)
3. La app va a crear automáticamente las hojas en el Google Sheet

## Deploy en GitHub Pages

### Variables de entorno en GitHub

En tu repo: Settings → Secrets and variables → Actions → New repository secret:
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_SPREADSHEET_ID`

### Habilitar GitHub Pages

Settings → Pages → Source: **GitHub Actions**

### Nombre del repo

En `vite.config.js`, cambiar `REPO_NAME` por el nombre de tu repo:
```js
const REPO_NAME = 'pipitos-finance' // ← nombre exacto del repo
```

El deploy se hace automáticamente al hacer push a `main`.

## Instalar como PWA en el celular

1. Abrir la URL de GitHub Pages en Chrome (Android) o Safari (iPhone)
2. Android: menú → "Agregar a pantalla de inicio"
3. iPhone: botón compartir → "Agregar a pantalla de inicio"

## Estructura de hojas en Google Sheets

La app crea automáticamente estas hojas:

| Hoja | Descripción |
|------|-------------|
| `gastos_agus` | Gastos personales de Agus |
| `gastos_meli` | Gastos personales de Meli |
| `gastos_compartidos` | Gastos de la casa (con monto_agus y monto_meli) |
| `categorias` | Categorías configurables |
| `config` | Sueldos, emails y configuración |

## Tipos de gasto

- **Fijo**: gasto mensual recurrente (alquiler, seguro, etc.)
- **Cuota**: compra en cuotas con mes de inicio y fin
- **Variable**: gasto puntual sin recurrencia

## Licencia

Uso personal 🐻🐱
