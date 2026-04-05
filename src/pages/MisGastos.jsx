import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { formatMoney, toNumber, tipoColor, tipoLabel } from '../utils/formatters'
import Header from '../components/Header'
import Modal from '../components/Modal'
import GastoForm from '../components/GastoForm'
import PieChart from '../components/PieChart'

const FILTROS = ['todos', 'fijo', 'cuota', 'variable']

function GastoItem({ gasto, categoria, onTap }) {
  return (
    <button onClick={() => onTap(gasto)} className="w-full text-left active:opacity-80 transition-opacity"
      style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, border: '1px solid #D9B99F30', boxShadow: '0 1px 8px 0 #A75F3708' }}
    >
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
          <div className="flex items-center gap-2 mt-0.5">
            {categoria && <p className="text-xs" style={{ color: '#A75F37' }}>{categoria.nombre}</p>}
            {gasto.tipo === 'cuota' && gasto.cuotas_total && (
              <p className="text-xs" style={{ color: '#CA8E82' }}>
                {gasto.restante} de {gasto.cuotas_total} restantes
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm" style={{ color: '#292421' }}>{formatMoney(toNumber(gasto.monto))}</p>
          {gasto.sync_status === 'pending' && (
            <p className="text-[10px]" style={{ color: '#A75F37' }}>pendiente</p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function MisGastos() {
  const user = useStore(s => s.user)
  const gastosAgus = useStore(s => s.gastosAgus)
  const gastosMeli = useStore(s => s.gastosMeli)
  const categorias = useStore(s => s.categorias)
  const addGasto = useStore(s => s.addGasto)
  const updateGasto = useStore(s => s.updateGasto)
  const deleteGasto = useStore(s => s.deleteGasto)

  const gastos = user?.role === 'agus' ? gastosAgus : gastosMeli

  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCat, setFiltroCat] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showChart, setShowChart] = useState(false)

  const gastosFiltrados = useMemo(() =>
    gastos.filter(g => {
      if (filtroTipo !== 'todos' && g.tipo !== filtroTipo) return false
      if (filtroCat && g.categoria_id !== filtroCat) return false
      return true
    }), [gastos, filtroTipo, filtroCat])

  const total = useMemo(() => gastosFiltrados.reduce((a, g) => a + toNumber(g.monto), 0), [gastosFiltrados])

  const getCat = (id) => categorias.find(c => c.id === id)

  const handleSave = async (data) => {
    if (selected) await updateGasto(selected.id, data)
    else await addGasto(data)
    setModalOpen(false); setSelected(null)
  }

  const handleDelete = async () => {
    if (!selected || !confirm(`Eliminar "${selected.nombre}"?`)) return
    await deleteGasto(selected.id)
    setModalOpen(false); setSelected(null)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ backgroundColor: '#F2E7DD' }}>
      <Header title="Mis Gastos" />

      {/* Filtros */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: filtroTipo === f ? '#A75F37' : 'white',
                color: filtroTipo === f ? 'white' : '#292421',
                border: `1px solid ${filtroTipo === f ? '#A75F37' : '#D9B99F'}`,
              }}
            >
              {f === 'todos' ? 'Todos' : tipoLabel(f)}
            </button>
          ))}
          {categorias.length > 0 && (
            <select
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full focus:outline-none"
              style={{ backgroundColor: 'white', border: '1px solid #D9B99F', color: '#292421' }}
              value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
            >
              <option value="">Todas las categorias</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Total + toggle gráfico */}
      {gastosFiltrados.length > 0 && (
        <div className="px-4 pb-2 flex items-center justify-between">
          <p className="text-xs" style={{ color: '#292421' }}>
            {gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-bold">{formatMoney(total)}</span>
          </p>
          <button onClick={() => setShowChart(!showChart)}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: showChart ? '#A75F37' : 'white', color: showChart ? 'white' : '#A75F37', border: '1px solid #A75F37' }}
          >
            {showChart ? 'Ver lista' : 'Ver grafico'}
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="px-4 flex flex-col gap-3">
        {gastosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-sm font-semibold" style={{ color: '#292421' }}>Sin gastos</p>
            <p className="text-xs mt-1" style={{ color: '#A75F37' }}>Toca + para agregar uno</p>
          </div>
        ) : showChart ? (
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'white', border: '1px solid #D9B99F30' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#7A958F' }}>
              Distribucion por categoria
            </p>
            <PieChart gastos={gastosFiltrados} categorias={categorias} />
          </div>
        ) : (
          gastosFiltrados.map(g => (
            <GastoItem key={g.id} gasto={g} categoria={getCat(g.categoria_id)}
              onTap={(g) => { setSelected(g); setModalOpen(true) }} />
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => { setSelected(null); setModalOpen(true) }}>+</button>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setSelected(null) }}
        title={selected ? 'Editar gasto' : 'Nuevo gasto'}>
        <GastoForm initial={selected} onSave={handleSave}
          onDelete={selected ? handleDelete : undefined}
          onCancel={() => { setModalOpen(false); setSelected(null) }} />
      </Modal>
    </div>
  )
}
