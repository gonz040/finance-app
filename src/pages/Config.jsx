import { useState } from 'react'
import useStore from '../store/useStore'
import { logout as authLogout } from '../services/authService'
import Header from '../components/Header'
import Modal from '../components/Modal'

const COLORES = ['#A75F37','#CA8E82','#7A958F','#D9B99F','#BAE0DA','#292421','#F2D6CE','#6366f1','#ef4444','#84cc16']

const inputStyle = {
  border: '1px solid #D9B99F', borderRadius: 12, padding: '12px 16px',
  width: '100%', fontSize: 14, color: '#292421', backgroundColor: 'white', outline: 'none',
}

function CategoriaItem({ cat, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #F2D6CE' }}>
      <span className="w-8 h-8 rounded-xl flex-shrink-0" style={{ backgroundColor: cat.color }} />
      <p className="flex-1 font-medium text-sm" style={{ color: '#292421' }}>{cat.nombre}</p>
      <button onClick={() => onDelete(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-lg"
        style={{ color: '#CA8E82' }}>×</button>
    </div>
  )
}

export default function Config() {
  const user = useStore(s => s.user)
  const config = useStore(s => s.config)
  const categorias = useStore(s => s.categorias)
  const saveConfig = useStore(s => s.saveConfig)
  const addCategoria = useStore(s => s.addCategoria)
  const deleteCategoria = useStore(s => s.deleteCategoria)
  const loadFromSheets = useStore(s => s.loadFromSheets)
  const storeLogout = useStore(s => s.logout)
  const syncStatus = useStore(s => s.syncStatus)
  const lastSync = useStore(s => s.lastSync)

  const [form, setForm] = useState({
    sueldoAgus:     String(config.sueldoAgus || ''),
    sueldoMeli:     String(config.sueldoMeli || ''),
    aporteAgus:     String(config.aporteAgus || ''),
    aporteMeli:     String(config.aporteMeli || ''),
    emailAgus:      config.emailAgus || '',
    emailMeli:      config.emailMeli || '',
    spreadsheetId:  config.spreadsheetId || import.meta.env.VITE_SPREADSHEET_ID || '',
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [modalCatOpen, setModalCatOpen] = useState(false)
  const [newCat, setNewCat] = useState({ nombre: '', color: COLORES[0] })

  const setF = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await saveConfig({
        sueldoAgus:   Number(form.sueldoAgus) || 0,
        sueldoMeli:   Number(form.sueldoMeli) || 0,
        aporteAgus:   Number(form.aporteAgus) || 0,
        aporteMeli:   Number(form.aporteMeli) || 0,
        emailAgus:    form.emailAgus.trim(),
        emailMeli:    form.emailMeli.trim(),
        spreadsheetId: form.spreadsheetId.trim(),
      })
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 2000)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleAddCategoria = async () => {
    if (!newCat.nombre.trim()) return alert('Ingresa un nombre')
    await addCategoria(newCat.nombre.trim(), newCat.color)
    setNewCat({ nombre: '', color: COLORES[0] })
    setModalCatOpen(false)
  }

  const handleLogout = () => {
    if (!confirm('Cerrar sesion?')) return
    authLogout()
    storeLogout()
  }

  const card = { backgroundColor: 'white', borderRadius: 20, padding: 20, border: '1px solid #D9B99F30', boxShadow: '0 1px 8px 0 #A75F3710' }

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ backgroundColor: '#F2E7DD' }}>
      <Header title="Configuracion" />

      <div className="px-4 pt-4 flex flex-col gap-5">

        {/* Usuario */}
        <div style={card} className="flex items-center gap-3">
          {user?.picture && <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />}
          <div>
            <p className="font-bold" style={{ color: '#292421' }}>{user?.name}</p>
            <p className="text-xs" style={{ color: '#A75F37' }}>{user?.email}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ backgroundColor: '#F2D6CE', color: '#A75F37' }}>
              {user?.role === 'agus' ? 'Agus' : 'Meli'}
            </span>
          </div>
        </div>

        {/* Sync */}
        <div style={card} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>Sincronizacion</p>
          <p className="text-sm" style={{ color: '#292421' }}>Estado: <span className="font-semibold">{syncStatus}</span></p>
          {lastSync && <p className="text-xs" style={{ color: '#A75F37' }}>Ultimo sync: {new Date(lastSync).toLocaleString('es-AR')}</p>}
          <button onClick={loadFromSheets} className="mt-1 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#7A958F' }}>
            Sincronizar ahora
          </button>
        </div>

        {/* Sueldos */}
        <div style={card} className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>Sueldos</p>
          <div className="flex gap-3">
            {['Agus', 'Meli'].map(who => (
              <div key={who} className="flex-1">
                <label className="label">Sueldo {who}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#A75F37' }}>$</span>
                  <input style={{ ...inputStyle, paddingLeft: 28 }} type="number" placeholder="0"
                    value={who === 'Agus' ? form.sueldoAgus : form.sueldoMeli}
                    onChange={e => setF(who === 'Agus' ? 'sueldoAgus' : 'sueldoMeli', e.target.value)}
                    inputMode="numeric" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aportes Casita */}
        <div style={card} className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>Aportes a la Casita</p>
          <p className="text-xs" style={{ color: '#A75F37' }}>Cuanto pasa cada uno al fondo comun por mes</p>
          <div className="flex gap-3">
            {['Agus', 'Meli'].map(who => (
              <div key={who} className="flex-1">
                <label className="label">Aporte {who}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#A75F37' }}>$</span>
                  <input style={{ ...inputStyle, paddingLeft: 28 }} type="number" placeholder="0"
                    value={who === 'Agus' ? form.aporteAgus : form.aporteMeli}
                    onChange={e => setF(who === 'Agus' ? 'aporteAgus' : 'aporteMeli', e.target.value)}
                    inputMode="numeric" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Google Sheets */}
        <div style={card} className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>Google Sheets</p>
          <div>
            <label className="label">Spreadsheet ID</label>
            <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
              placeholder="El ID de la URL de tu Google Sheet"
              value={form.spreadsheetId} onChange={e => setF('spreadsheetId', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Email Agus</label>
              <input style={inputStyle} type="email" placeholder="agus@gmail.com"
                value={form.emailAgus} onChange={e => setF('emailAgus', e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Email Meli</label>
              <input style={inputStyle} type="email" placeholder="meli@gmail.com"
                value={form.emailMeli} onChange={e => setF('emailMeli', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Guardar config */}
        <button onClick={handleSaveConfig} disabled={savingConfig}
          className="btn-primary"
          style={{ backgroundColor: configSaved ? '#7A958F' : '#A75F37' }}>
          {configSaved ? 'Guardado!' : savingConfig ? 'Guardando...' : 'Guardar configuracion'}
        </button>

        {/* Categorías */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A958F' }}>Categorias</p>
            <button onClick={() => setModalCatOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: '#A75F37' }}>
              + Nueva
            </button>
          </div>
          {categorias.length === 0
            ? <p className="text-sm text-center py-4" style={{ color: '#D9B99F' }}>Sin categorias aun</p>
            : categorias.map(cat => <CategoriaItem key={cat.id} cat={cat} onDelete={deleteCategoria} />)
          }
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn-danger">Cerrar sesion</button>
        <div className="h-4" />
      </div>

      {/* Modal nueva categoría */}
      <Modal open={modalCatOpen} onClose={() => setModalCatOpen(false)} title="Nueva categoria">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Nombre</label>
            <input style={inputStyle} placeholder="Ej: Casa, Auto, Comida..."
              value={newCat.nombre} onChange={e => setNewCat(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES.map(c => (
                <button key={c} onClick={() => setNewCat(p => ({ ...p, color: c }))}
                  className="w-10 h-10 rounded-xl transition-transform"
                  style={{ backgroundColor: c, transform: newCat.color === c ? 'scale(1.15)' : 'scale(1)',
                    outline: newCat.color === c ? `3px solid #292421` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button className="btn-primary" onClick={handleAddCategoria}>Agregar</button>
            <button className="btn-secondary" onClick={() => setModalCatOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
