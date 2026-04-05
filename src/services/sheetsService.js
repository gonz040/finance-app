/**
 * sheetsService.js
 * CRUD sobre Google Sheets API v4 via REST.
 * Cada hoja tiene una fila de headers en la fila 1, datos desde la fila 2.
 *
 * Estructura de hojas:
 *   gastos_agus / gastos_meli:
 *     id | nombre | categoria_id | tipo | monto | mes_inicio | mes_fin | restante | fecha | sync_status
 *
 *   gastos_compartidos:
 *     id | nombre | categoria_id | tipo | monto_agus | monto_meli | mes_inicio | mes_fin | restante | fecha | sync_status
 *
 *   categorias:
 *     id | nombre | color
 *
 *   config:
 *     clave | valor
 */

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

// Headers por hoja
export const SHEET_HEADERS = {
  gastos_meli:        ['id', 'nombre', 'categoria_id', 'tipo', 'monto', 'cuotas_total', 'cuotas_pagadas', 'restante', 'fecha', 'sync_status'],
  gastos_compartidos: ['id', 'nombre', 'categoria_id', 'tipo', 'monto', 'fecha', 'sync_status'],
  gastos_agus:        ['id', 'nombre', 'categoria_id', 'tipo', 'monto', 'cuotas_total', 'cuotas_pagadas', 'restante', 'fecha', 'sync_status'],
  categorias:         ['id', 'nombre', 'color'],
  config:             ['clave', 'valor'],
}

let _token = null
let _spreadsheetId = null

// Inicializa el servicio con token y spreadsheet ID
export function initSheets(token, spreadsheetId) {
  _token = token
  _spreadsheetId = spreadsheetId
}

function getHeaders() {
  return {
    Authorization: `Bearer ${_token}`,
    'Content-Type': 'application/json',
  }
}

// Crea las hojas con headers si no existen (primera vez)
export async function setupSpreadsheet() {
  // Obtener hojas existentes
  const meta = await fetch(`${BASE_URL}/${_spreadsheetId}`, {
    headers: getHeaders()
  }).then(r => r.json())

  const existingSheets = meta.sheets?.map(s => s.properties.title) || []
  const requiredSheets = Object.keys(SHEET_HEADERS)
  const sheetsToCreate = requiredSheets.filter(s => !existingSheets.includes(s))

  if (sheetsToCreate.length > 0) {
    // Crear hojas faltantes
    await fetch(`${BASE_URL}/${_spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        requests: sheetsToCreate.map(title => ({
          addSheet: { properties: { title } }
        }))
      })
    })

    // Escribir headers en cada hoja nueva
    const data = sheetsToCreate.map(sheetName => ({
      range: `${sheetName}!A1`,
      values: [SHEET_HEADERS[sheetName]]
    }))

    await fetch(`${BASE_URL}/${_spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data
      })
    })
  }
}

// Lee todos los datos de una hoja y los convierte a array de objetos
export async function readSheet(sheetName) {
  const res = await fetch(
    `${BASE_URL}/${_spreadsheetId}/values/${sheetName}`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Error leyendo ${sheetName}: ${res.statusText}`)

  const data = await res.json()
  const rows = data.values || []
  if (rows.length <= 1) return [] // Solo headers o vacío

  const headers = SHEET_HEADERS[sheetName]
  return rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : ''
    })
    return obj
  })
}

// Agrega una fila al final de la hoja
export async function appendRow(sheetName, rowData) {
  const headers = SHEET_HEADERS[sheetName]
  const values = [headers.map(h => rowData[h] !== undefined ? String(rowData[h]) : '')]

  const res = await fetch(
    `${BASE_URL}/${_spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ values })
    }
  )
  if (!res.ok) throw new Error(`Error escribiendo en ${sheetName}: ${res.statusText}`)
  return res.json()
}

// Actualiza una fila completa buscando por ID
export async function updateRowById(sheetName, id, rowData) {
  const allRows = await getAllRawRows(sheetName)
  const rowIndex = allRows.findIndex(row => row[0] === id)
  if (rowIndex === -1) throw new Error(`ID ${id} no encontrado en ${sheetName}`)

  const sheetRow = rowIndex + 2 // +1 por header, +1 porque Sheets es 1-indexed
  const headers = SHEET_HEADERS[sheetName]
  const values = [headers.map(h => rowData[h] !== undefined ? String(rowData[h]) : '')]

  const res = await fetch(
    `${BASE_URL}/${_spreadsheetId}/values/${sheetName}!A${sheetRow}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ values })
    }
  )
  if (!res.ok) throw new Error(`Error actualizando en ${sheetName}: ${res.statusText}`)
  return res.json()
}

// Elimina una fila por ID (limpia los valores de la fila)
// En Sheets API no se puede eliminar fila fácilmente sin batchUpdate, así que vaciamos el contenido
// y al leer filtramos filas sin ID.
export async function deleteRowById(sheetName, id) {
  const allRows = await getAllRawRows(sheetName)
  const rowIndex = allRows.findIndex(row => row[0] === id)
  if (rowIndex === -1) throw new Error(`ID ${id} no encontrado en ${sheetName}`)

  const sheetRow = rowIndex + 2
  const headers = SHEET_HEADERS[sheetName]
  const emptyRow = [headers.map(() => '')]

  // Primero vaciamos la fila
  await fetch(
    `${BASE_URL}/${_spreadsheetId}/values/${sheetName}!A${sheetRow}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ values: emptyRow })
    }
  )

  // Luego eliminamos físicamente la fila con batchUpdate
  const metaRes = await fetch(`${BASE_URL}/${_spreadsheetId}`, { headers: getHeaders() })
  const meta = await metaRes.json()
  const sheet = meta.sheets?.find(s => s.properties.title === sheetName)
  if (!sheet) throw new Error(`Hoja ${sheetName} no encontrada`)

  const sheetId = sheet.properties.sheetId
  await fetch(`${BASE_URL}/${_spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex + 1, // 0-indexed, +1 por header
            endIndex: rowIndex + 2
          }
        }
      }]
    })
  })
}

// Sincroniza un lote de cambios pendientes
export async function syncPendingChanges(pendingChanges) {
  const errors = []
  for (const change of pendingChanges) {
    try {
      if (change.action === 'add') {
        await appendRow(change.sheet, change.data)
      } else if (change.action === 'update') {
        await updateRowById(change.sheet, change.data.id, change.data)
      } else if (change.action === 'delete') {
        await deleteRowById(change.sheet, change.id)
      }
    } catch (err) {
      errors.push({ change, error: err.message })
    }
  }
  return errors
}

// Lee todas las filas crudas (sin convertir a objeto)
async function getAllRawRows(sheetName) {
  const res = await fetch(
    `${BASE_URL}/${_spreadsheetId}/values/${sheetName}`,
    { headers: getHeaders() }
  )
  const data = await res.json()
  const rows = data.values || []
  return rows.slice(1) // quitar header
}

// Lee config como objeto key-value
export async function readConfig() {
  const rows = await readSheet('config')
  const config = {}
  rows.forEach(row => {
    if (row.clave) config[row.clave] = row.valor
  })
  return config
}

// Escribe un valor de config (upsert)
export async function writeConfig(clave, valor) {
  const allRows = await getAllRawRows('config')
  const rowIndex = allRows.findIndex(row => row[0] === clave)

  if (rowIndex === -1) {
    await appendRow('config', { clave, valor: String(valor) })
  } else {
    const sheetRow = rowIndex + 2
    await fetch(
      `${BASE_URL}/${_spreadsheetId}/values/config!A${sheetRow}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ values: [[clave, String(valor)]] })
      }
    )
  }
}
