import { useMemo } from 'react'
import useStore from '../store/useStore'
import { formatMoney, toNumber, currentMonth } from '../utils/formatters'
import Header from '../components/Header'

function StatCard({ label, value, sub, bg, textColor = '#292421' }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, boxShadow: '0 1px 8px 0 #A75F3710' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: textColor, opacity: 0.7 }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: textColor }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const user = useStore(s => s.user)
  const gastosAgus = useStore(s => s.gastosAgus)
  const gastosMeli = useStore(s => s.gastosMeli)
  const gastosCompartidos = useStore(s => s.gastosCompartidos)
  const config = useStore(s => s.config)

  const mesActual = currentMonth()

  const stats = useMemo(() => {
    const gastos = user?.role === 'agus' ? gastosAgus : gastosMeli
    const sueldo = user?.role === 'agus' ? toNumber(config.sueldoAgus) : toNumber(config.sueldoMeli)

    const gastosFijos = gastos.filter(g => g.tipo === 'fijo').reduce((a, g) => a + toNumber(g.monto), 0)
    const cuotas = gastos.filter(g => g.tipo === 'cuota').reduce((a, g) => a + toNumber(g.monto), 0)
    const variables = gastos.filter(g => g.tipo === 'variable').reduce((a, g) => a + toNumber(g.monto), 0)
    const totalAPagar = gastosFijos + cuotas + variables
    const neto = sueldo - totalAPagar

    // Cuotas que terminan pronto (restante = 1)
    const ahorroProximo = gastos
      .filter(g => g.tipo === 'cuota' && Number(g.restante) === 1)
      .reduce((a, g) => a + toNumber(g.monto), 0)

    return { sueldo, gastosFijos, cuotas, variables, totalAPagar, neto, ahorroProximo }
  }, [user, gastosAgus, gastosMeli, config])

  const fondoCasita = toNumber(config.aporteAgus) + toNumber(config.aporteMeli)
  const gastadoCasita = gastosCompartidos.reduce((a, g) => a + toNumber(g.monto), 0)
  const saldoCasita = fondoCasita - gastadoCasita

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos dias'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Importar la foto del directorio public
  const BASE = import.meta.env.BASE_URL

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ backgroundColor: '#F2E7DD' }}>
      <Header title="Inicio" />

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Hero foto pipitos */}
        <div className="relative rounded-3xl overflow-hidden" style={{ height: 220 }}>
          <img
            src={`${BASE}pipitos.jpg`}
            alt="Agus y Meli"
            className="w-full h-full object-cover"
          style={{ objectPosition: '50% 65%' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          {/* Gradiente oscuro abajo */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #29242180 0%, transparent 60%)' }}
          />
          {/* Leyenda */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <p className="text-white text-base font-bold italic" style={{ textShadow: '0 1px 4px #00000060' }}>
              "Cuentas claras conservan a pipitos"
            </p>
          </div>
          {/* Placeholder si no hay foto */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: '#D9B99F', display: 'none' }}
            id="photo-placeholder"
          >
            <p className="text-4xl">🐻🐱</p>
            <p className="text-sm font-bold mt-2 italic" style={{ color: '#292421' }}>"Cuentas claras conservan a pipitos"</p>
          </div>
        </div>

        {/* Saludo */}
        <div>
          <p className="text-xl font-bold" style={{ color: '#292421' }}>
            {greeting()}, {user?.name?.split(' ')[0]}
          </p>
          <p className="text-sm" style={{ color: '#A75F37' }}>Resumen del mes</p>
        </div>

        {/* Sueldo */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#A75F37' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white opacity-70 mb-1">Sueldo</p>
          <p className="text-3xl font-bold text-white">{formatMoney(stats.sueldo)}</p>
        </div>

        {/* Grid stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total a pagar" value={formatMoney(stats.totalAPagar)} bg="#CA8E82" textColor="white" />
          <StatCard label="Neto" value={formatMoney(stats.neto)} bg={stats.neto >= 0 ? '#7A958F' : '#CA8E82'} textColor="white" />
          <StatCard label="Gastos fijos" value={formatMoney(stats.gastosFijos)} bg="white" />
          <StatCard label="Cuotas" value={formatMoney(stats.cuotas)} bg="#F2D6CE" />
          {stats.variables > 0 && (
            <StatCard label="Variables" value={formatMoney(stats.variables)} bg="#D9B99F" />
          )}
          {stats.ahorroProximo > 0 && (
            <StatCard label="Libera prox. mes" value={formatMoney(stats.ahorroProximo)} sub="Cuotas que terminan" bg="#BAE0DA" />
          )}
        </div>

        {/* Casita */}
        {fondoCasita > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'white', border: '1px solid #D9B99F40' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#7A958F' }}>Fondo Casita</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs" style={{ color: '#A75F37' }}>Fondo total</p>
                <p className="text-xl font-bold" style={{ color: '#292421' }}>{formatMoney(fondoCasita)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#A75F37' }}>Saldo</p>
                <p className="text-xl font-bold" style={{ color: saldoCasita >= 0 ? '#7A958F' : '#CA8E82' }}>
                  {formatMoney(saldoCasita)}
                </p>
              </div>
            </div>
            {/* Barra de progreso */}
            {fondoCasita > 0 && (
              <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: '#F2D6CE' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (gastadoCasita / fondoCasita) * 100)}%`,
                    backgroundColor: saldoCasita >= 0 ? '#7A958F' : '#CA8E82'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {stats.sueldo === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'white' }}>
            <p className="text-3xl mb-2">⚙️</p>
            <p className="text-sm font-bold" style={{ color: '#292421' }}>Configurá tu sueldo</p>
            <p className="text-xs mt-1" style={{ color: '#A75F37' }}>Anda a Config para empezar</p>
          </div>
        )}
      </div>
    </div>
  )
}
