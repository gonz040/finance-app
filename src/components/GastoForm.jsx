import { useState } from 'react'
import useStore from '../store/useStore'

const TIPOS = ['fijo', 'cuota', 'variable']

const DEFAULT = { nombre: '', categoria_id: '', tipo: 'fijo', monto: '', cuotas_total: '', cuotas_pagadas: '' }

export default function GastoForm({ initial = null, onSave, onDelete, onCancel }) {
  const categorias = useStore(s => s.categorias)
  const [form, setForm] = useState(initial ? {
    nombre:         initial.nombre || '',
    categoria_id:   initial.categoria_id || '',
    tipo:           initial.tipo || 'fijo',
    monto:          initial.monto || '',
    cuotas_total:   initial.cuotas_total || '',
    cuotas_pagadas: initial.cuotas_pagadas || '',
  } : DEFAULT)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const restante = form.tipo === 'cuota' && form.cuotas_total && form.cuotas_pagadas
    ? Math.max(0, Number(form.cuotas_total) - Number(form.cuotas_pagadas))
    : null

  const handleSave = () => {
    if (!form.nombre.trim()) return alert('Ingresa un nombre')
    if (!form.monto || isNaN(Number(form.monto))) return alert('Ingresa un monto valido')
    if (form.tipo === 'cuota') {
      if (!form.cuotas_total) return alert('Ingresa la cantidad de cuotas')
      if (!form.cuotas_pagadas) return alert('Ingresa cuantas cuotas ya pagaste (puede ser 0)')
    }
    onSave({
      ...form,
      monto: String(Number(form.monto)),
      cuotas_total:   form.tipo === 'cuota' ? String(form.cuotas_total) : '',
      cuotas_pagadas: form.tipo === 'cuota' ? String(form.cuotas_pagadas) : '',
      restante:       form.tipo === 'cuota' ? String(restante) : '',
    })
  }

  const inputStyle = {
    border: '1px solid #D9B99F',
    borderRadius: 12,
    padding: '12px 16px',
    width: '100%',
    fontSize: 14,
    color: '#292421',
    backgroundColor: 'white',
    outline: 'none',
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Nombre */}
      <div>
        <label className="label">Nombre</label>
        <input style={inputStyle} placeholder="Ej: Netflix, Nafta..." value={form.nombre} onChange={e => set('nombre', e.target.value)} />
      </div>

      {/* Categoría */}
      <div>
        <label className="label">Categoria</label>
        <select style={inputStyle} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
          <option value="">Sin categoria</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Tipo */}
      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-2">
          {TIPOS.map(t => (
            <button key={t} type="button" onClick={() => set('tipo', t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors"
              style={{
                backgroundColor: form.tipo === t ? '#A75F37' : '#F2D6CE',
                color: form.tipo === t ? 'white' : '#292421',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Monto */}
      <div>
        <label className="label">Monto mensual</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold" style={{ color: '#A75F37' }}>$</span>
          <input style={{ ...inputStyle, paddingLeft: 32 }} type="number" placeholder="0" value={form.monto} onChange={e => set('monto', e.target.value)} inputMode="numeric" />
        </div>
      </div>

      {/* Cuotas */}
      {form.tipo === 'cuota' && (
        <>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Cuotas totales</label>
              <input style={inputStyle} type="number" placeholder="Ej: 12" value={form.cuotas_total} onChange={e => set('cuotas_total', e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className="label">Ya pagaste</label>
              <input style={inputStyle} type="number" placeholder="Ej: 3" value={form.cuotas_pagadas} onChange={e => set('cuotas_pagadas', e.target.value)} inputMode="numeric" />
            </div>
          </div>
          {restante !== null && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#F2D6CE', color: '#292421' }}>
              Te quedan <span className="font-bold">{restante} cuota{restante !== 1 ? 's' : ''}</span> por pagar
            </div>
          )}
        </>
      )}

      {/* Botones */}
      <div className="flex flex-col gap-2 pt-2">
        <button className="btn-primary" onClick={handleSave}>{initial ? 'Guardar cambios' : 'Agregar gasto'}</button>
        {initial && onDelete && <button className="btn-danger" onClick={onDelete}>Eliminar gasto</button>}
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
