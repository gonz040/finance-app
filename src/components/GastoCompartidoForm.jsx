import { useState } from 'react'
import useStore from '../store/useStore'

const TIPOS = ['fijo', 'variable']

const DEFAULT = { nombre: '', categoria_id: '', tipo: 'fijo', monto: '' }

const inputStyle = {
  border: '1px solid #D9B99F', borderRadius: 12, padding: '12px 16px',
  width: '100%', fontSize: 14, color: '#292421', backgroundColor: 'white', outline: 'none',
}

export default function GastoCompartidoForm({ initial = null, onSave, onDelete, onCancel }) {
  const categorias = useStore(s => s.categorias)
  const [form, setForm] = useState(initial ? {
    nombre:       initial.nombre || '',
    categoria_id: initial.categoria_id || '',
    tipo:         initial.tipo || 'fijo',
    monto:        initial.monto || '',
  } : DEFAULT)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = () => {
    if (!form.nombre.trim()) return alert('Ingresa un nombre')
    if (!form.monto || isNaN(Number(form.monto))) return alert('Ingresa un monto valido')
    onSave({ ...form, monto: String(Number(form.monto)) })
  }

  return (
    <div className="flex flex-col gap-4">

      <div>
        <label className="label">Nombre</label>
        <input style={inputStyle} placeholder="Ej: Alquiler, Expensas..." value={form.nombre} onChange={e => set('nombre', e.target.value)} />
      </div>

      <div>
        <label className="label">Categoria</label>
        <select style={inputStyle} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
          <option value="">Sin categoria</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-2">
          {TIPOS.map(t => (
            <button key={t} type="button" onClick={() => set('tipo', t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize"
              style={{ backgroundColor: form.tipo === t ? '#A75F37' : '#F2D6CE', color: form.tipo === t ? 'white' : '#292421' }}
            >
              {t === 'fijo' ? 'Fijo' : 'Variable'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Monto total del gasto</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#A75F37' }}>$</span>
          <input style={{ ...inputStyle, paddingLeft: 32 }} type="number" placeholder="0" value={form.monto} onChange={e => set('monto', e.target.value)} inputMode="numeric" />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button className="btn-primary" onClick={handleSave}>{initial ? 'Guardar cambios' : 'Agregar gasto'}</button>
        {initial && onDelete && <button className="btn-danger" onClick={onDelete}>Eliminar</button>}
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
