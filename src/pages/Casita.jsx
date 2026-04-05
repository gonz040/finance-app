import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { formatMoney, toNumber, tipoColor, tipoLabel } from '../utils/formatters'
import Header from '../components/Header'
import Modal from '../components/Modal'
import GastoCompartidoForm from '../components/GastoCompartidoForm'
import PieChart from '../components/PieChart'

function GastoItem({ gasto, categoria, onTap }) {
  return (
    <button onClick={() => onTap(gasto)} className="w-full text-left active:opacity-80"
      style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, border: '1px solid #D9B99F30', boxShadow: '0 1px 8px 0 #A75F3708' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: categoria?.color || '#D9B99F' }}>
          {(gasto.nombre || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: '#292421' }}>{gasto.nombre}</p>
            <span className={tipoColor(gasto.tipo)}>{tipoLabel(gasto.tipo)}</span>
          </div>
          {categoria && <p className="text-xs mt-0.5" style={{ color: '#A75F37' }}>{categoria.nombre}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm" style={{ color: '#292421' }}>{formatMoney(toNumber(gasto.monto))}</p>
          {gasto.sync_status === 'pending' && <p className="text-[10px]" style={{ color: '#A75F37' }}>pendiente</p>}
        </div>
      </div>
    </button>
  )
}

export default function Casita() {
  const gastosCompartidos = useStore(s => s.gastosCompartidos)
  const categorias = useStore(s => s.categorias)
  const config = useStore(s => s.config)
  const addGastoCompartido = useStore(s => s.addGastoCompartido)
  const updateGastoCompartido = useStore(s => s.updateGastoCompartido)
  const deleteGastoCompartido = useStore(s => s.deleteGastoCompartido)

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showChart, setShowChart] = useState(false)

  const aporteAgus = toNumber(config.aporteAgus)
  const aporteMeli = toNumber(config.aporteMeli)
  const fondo = aporteAgus + aporteMeli
  const gastado = useMemo(() => gastosCompartidos.reduce((a, g) => a + toNumber(g.monto), 0), [gastosCompartidos])
  const saldo = fondo - gastado
  const pctUsado = fondo > 0 ? Math.min(100, (gastado / fondo) * 100) : 0

  const getCat = (id) => categorias.find(c => c.id === id)

  const handleSave = async (data) => {
    if (selected) await updateGastoCompartido(selected.id, data)
    else await addGastoCompartido(data)
    setModalOpen(false); setSelected(null)
  }

  const handleDelete = async () => {
    if (!selected || !confirm(`Eliminar "${selected.nombre}"?`)) return
    await deleteGastoCompartido(selected.id)
    setModalOpen(false); setSelected(null)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ backgroundColor: '#F2E7DD' }}>
      <Header title="Casita" />

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Fondo común */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#292421' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#D9B99F' }}>
            Fondo comun del mes
          </p>

          {/* Aportes */}
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#D9B99F' }}>Agus aporta</p>
              <p className="text-lg font-bold text-white">{formatMoney(aporteAgus)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs mb-0.5" style={{ color: '#D9B99F' }}>Meli aporta</p>
              <p className="text-lg font-bold text-white">{formatMoney(aporteMeli)}</p>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px mb-4" style={{ backgroundColor: '#D9B99F30' }} />

          {/* Totales */}
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs" style={{ color: '#D9B99F' }}>Total fondo</p>
              <p className="text-2xl font-bold text-white">{formatMoney(fondo)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#D9B99F' }}>Saldo</p>
              <p className="text-2xl font-bold" style={{ color: saldo >= 0 ? '#BAE0DA' : '#CA8E82' }}>
                {formatMoney(saldo)}
              </p>
            </div>
          </div>

          {/* Barra */}
          <div className="h-2 rounded-full" style={{ backgroundColor: '#D9B99F30' }}>
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${pctUsado}%`, backgroundColor: saldo >= 0 ? '#7A958F' : '#CA8E82' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#D9B99F' }}>
            Gastado: {formatMoney(gastado)} ({Math.round(pctUsado)}%)
          </p>
        </div>

        {/* Gastos + toggle gráfico */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>
            Gastos ({gastosCompartidos.length})
          </p>
          {gastosCompartidos.length > 0 && (
            <button onClick={() => setShowChart(!showChart)}
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: showChart ? '#A75F37' : 'white', color: showChart ? 'white' : '#A75F37', border: '1px solid #A75F37' }}>
              {showChart ? 'Ver lista' : 'Ver grafico'}
            </button>
          )}
        </div>

        {gastosCompartidos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-sm font-semibold" style={{ color: '#292421' }}>Sin gastos en la casita</p>
            <p className="text-xs mt-1" style={{ color: '#A75F37' }}>Toca + para agregar</p>
          </div>
        ) : showChart ? (
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'white' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#7A958F' }}>
              Distribucion por categoria
            </p>
            <PieChart gastos={gastosCompartidos} categorias={categorias} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {gastosCompartidos.map(g => (
              <GastoItem key={g.id} gasto={g} categoria={getCat(g.categoria_id)}
                onTap={(g) => { setSelected(g); setModalOpen(true) }} />
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => { setSelected(null); setModalOpen(true) }}>+</button>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null) }}
        title={selected ? 'Editar gasto' : 'Nuevo gasto casita'}>
        <GastoCompartidoForm initial={selected} onSave={handleSave}
          onDelete={selected ? handleDelete : undefined}
          onCancel={() => { setModalOpen(false); setSelected(null) }} />
      </Modal>
    </div>
  )
}
