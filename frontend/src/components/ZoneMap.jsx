function riskColor(r) {
  if (r >= 0.65) return { ring: 'ring-danger', text: 'text-danger', bg: 'from-panel2 to-[#4A1F1D]' }
  if (r >= 0.4) return { ring: 'ring-amber', text: 'text-amber', bg: 'from-panel2 to-[#5A4017]' }
  return { ring: 'ring-safe', text: 'text-safe', bg: 'from-panel2 to-[#163A2C]' }
}

export default function ZoneMap({ zones, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {zones.map((z) => {
        const c = riskColor(z.risk)
        const isSelected = z.id === selected
        const isHigh = z.risk >= 0.65
        return (
          <button
            key={z.id}
            onClick={() => onSelect(z.id)}
            className={`text-left rounded-xl p-4 border transition-all bg-gradient-to-b ${c.bg}
              ${isSelected ? 'border-amber ring-1 ring-amber' : 'border-border hover:border-text3'}
              ${isHigh ? 'animate-pulse' : ''}`}
          >
            <div className="text-[12.5px] font-medium mb-1.5">{z.name}</div>
            <div className={`font-mono text-2xl font-bold ${c.text}`}>{Math.round(z.risk * 100)}%</div>
            <div className="text-[10px] uppercase tracking-wide text-text3 mt-0.5">Risk index</div>
            {z.baseline_flag === 0 && z.risk >= 0.65 && (
              <div className="text-[10px] text-danger mt-2 font-medium">⚠ Baseline would miss this</div>
            )}
          </button>
        )
      })}
    </div>
  )
}
