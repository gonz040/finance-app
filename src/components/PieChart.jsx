import { useMemo } from 'react'
import { formatMoney, toNumber } from '../utils/formatters'

const PALETTE = ['#A75F37', '#CA8E82', '#7A958F', '#D9B99F', '#BAE0DA', '#F2D6CE', '#292421', '#F2E7DD']

export default function PieChart({ gastos, categorias }) {
  const data = useMemo(() => {
    const sinCat = 'sin-categoria'
    const totals = {}

    gastos.forEach(g => {
      const catId = g.categoria_id || sinCat
      totals[catId] = (totals[catId] || 0) + toNumber(g.monto)
    })

    const total = Object.values(totals).reduce((a, b) => a + b, 0)
    if (total === 0) return []

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([catId, value], i) => {
        const cat = categorias.find(c => c.id === catId)
        return {
          label: cat?.nombre || 'Sin categoria',
          value,
          pct: value / total,
          color: cat?.color || PALETTE[i % PALETTE.length],
        }
      })
  }, [gastos, categorias])

  if (!data.length) return null

  // Construir arcos SVG
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 58
  const innerR = 35

  let cumulativeAngle = -Math.PI / 2

  const arcs = data.map((slice) => {
    const angle = slice.pct * 2 * Math.PI
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(startAngle)
    const iy1 = cy + innerR * Math.sin(startAngle)
    const ix2 = cx + innerR * Math.cos(endAngle)
    const iy2 = cy + innerR * Math.sin(endAngle)
    const large = angle > Math.PI ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}`,
      'Z'
    ].join(' ')

    return { ...slice, d }
  })

  const total = data.reduce((a, d) => a + d.value, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* SVG donut */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {arcs.map((arc, i) => (
              <path key={i} d={arc.d} fill={arc.color} stroke="white" strokeWidth={2} />
            ))}
            {/* Centro */}
            <circle cx={cx} cy={cy} r={innerR - 2} fill="#F2E7DD" />
          </svg>
          {/* Label centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold" style={{ color: '#A75F37' }}>Total</p>
            <p className="text-xs font-bold" style={{ color: '#292421' }}>{formatMoney(total)}</p>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col gap-2">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-sm" style={{ color: '#292421' }}>{slice.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: '#A75F37' }}>
                {Math.round(slice.pct * 100)}%
              </span>
              <span className="text-sm font-bold" style={{ color: '#292421' }}>{formatMoney(slice.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
