// Geospatial plant-layout risk heatmap.
// Renders each zone as a positioned block on an SVG site plan (not a card
// grid) so risk is read spatially — which zone, relative to which other
// zone, is heating up — matching the "Geospatial Safety Heatmap" deliverable.

function riskFill(r) {
  if (r >= 0.65) return '#CC0000'
  if (r >= 0.4) return '#D97706'
  return '#16A34A'
}

function riskLabel(r) {
  if (r >= 0.65) return 'CRITICAL'
  if (r >= 0.4) return 'ELEVATED'
  return 'NOMINAL'
}

export default function ZoneMap({ zones, selected, onSelect }) {
  const VW = 100, VH = 100

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto rounded-xl border border-border bg-surface-2" style={{ minHeight: 320 }}>
        <rect x="1" y="1" width={VW - 2} height={VH - 2} fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="0.4" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 10} y1="1" x2={(i + 1) * 10} y2={VH - 1} stroke="#EFEFEF" strokeWidth="0.25" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="1" y1={(i + 1) * 10} x2={VW - 1} y2={(i + 1) * 10} stroke="#EFEFEF" strokeWidth="0.25" />
        ))}

        <path d="M 43 51 Q 55 51 60 40" fill="none" stroke="#CCCCCC" strokeWidth="0.8" strokeDasharray="1.5,1" />

        {zones.map((z) => {
          const fill = riskFill(z.risk)
          const isSelected = z.id === selected
          const isHigh = z.risk >= 0.65
          const missedByBaseline = z.baseline_flag === 0 && isHigh
          return (
            <g
              key={z.id}
              onClick={() => onSelect(z.id)}
              style={{ cursor: 'pointer' }}
              className={isHigh ? 'pulse-danger' : ''}
            >
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h} rx="1.5"
                fill={fill} fillOpacity={isSelected ? 0.32 : 0.16}
                stroke={fill} strokeWidth={isSelected ? 0.9 : 0.5}
              />
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 3} textAnchor="middle"
                fontSize="2.6" fontWeight="600" fill="#1A1A1A">
                {z.name}
              </text>
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
                fontSize="4.2" fontWeight="800" fill={fill}>
                {Math.round(z.risk * 100)}%
              </text>
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 7.5} textAnchor="middle"
                fontSize="2" letterSpacing="0.05em" fill="#666666">
                {riskLabel(z.risk)}
              </text>
              {missedByBaseline && (
                <text x={z.x + z.w / 2} y={z.y + z.h - 1.5} textAnchor="middle"
                  fontSize="1.9" fontWeight="600" fill="#CC0000">
                  ⚠ baseline misses this
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#16A34A' }} /> Nominal (&lt;40%)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#D97706' }} /> Elevated (40–65%)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#CC0000' }} /> Critical (&ge;65%)</span>
      </div>
    </div>
  )
}
