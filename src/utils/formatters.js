export function formatMoney(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num)
}

export function toNumber(val) {
  const n = parseFloat(String(val || '').replace(/[.$,]/g, ''))
  return isNaN(n) ? 0 : n
}

export function currentMonth() {
  return new Date().getMonth() + 1
}

// Cuotas: restante = total - pagadas
export function calcRestante(cuotasTotal, cuotasPagadas) {
  const total = parseInt(cuotasTotal) || 0
  const pagadas = parseInt(cuotasPagadas) || 0
  return Math.max(0, total - pagadas)
}

export function tipoColor(tipo) {
  switch (tipo) {
    case 'fijo':     return 'badge-fijo'
    case 'cuota':    return 'badge-cuota'
    case 'variable': return 'badge-variable'
    default:         return 'badge-fijo'
  }
}

export function tipoLabel(tipo) {
  switch (tipo) {
    case 'fijo':     return 'Fijo'
    case 'cuota':    return 'Cuota'
    case 'variable': return 'Variable'
    default:         return tipo
  }
}
