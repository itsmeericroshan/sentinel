function FactorBar({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-none text-[13px]">
      <span>{label}</span>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-text2 text-[12px]">{Math.round(value)}</span>
        <div className="w-24 h-1.5 bg-panel2 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
        </div>
      </div>
    </div>
  )
}

export default function DetailPanel({ zoneName, detail, counterfactual, onRunCounterfactual }) {
  if (!detail) {
    return <div className="text-text3 text-[12.5px]">Select a zone to inspect its live factors.</div>
  }
  const { readings, risk, baseline_flag } = detail
  const riskColor = risk >= 0.65 ? '#E2504A' : risk >= 0.4 ? '#F2A623' : '#3FAE82'

  return (
    <div>
      <FactorBar label="Gas / atmospheric pressure" value={readings.gas} color="#E2504A" />
      <FactorBar label="Ventilation deficit" value={100 - readings.vent} color="#F2A623" />
      <div className="flex justify-between items-center py-1.5 border-b border-border text-[13px]">
        <span>Hot-work permit active</span>
        <span className={`font-mono text-[12px] ${readings.permit ? 'text-danger' : 'text-text3'}`}>
          {readings.permit ? 'YES' : 'no'}
        </span>
      </div>
      <div className="flex justify-between items-center py-1.5 border-b border-border text-[13px]">
        <span>Maintenance activity</span>
        <span className={`font-mono text-[12px] ${readings.maint ? 'text-amber' : 'text-text3'}`}>
          {readings.maint ? 'YES' : 'no'}
        </span>
      </div>
      <FactorBar label="Worker proximity" value={readings.prox} color="#4B8FD8" />

      <div className="flex justify-between items-center pt-3 mt-2 border-t border-border">
        <span className="font-semibold text-[13.5px]">Causal risk score</span>
        <span className="font-mono text-lg font-bold" style={{ color: riskColor }}>
          {Math.round(risk * 100)}%
        </span>
      </div>
      <div className="flex justify-between items-center py-1.5 text-[11.5px] text-text3">
        <span>Single-sensor baseline would flag</span>
        <span className="font-mono">{baseline_flag ? 'YES' : 'no'}</span>
      </div>

      {readings.permit === 1 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-[11px] uppercase tracking-wide text-text3 mb-2">
            Counterfactual — revoke active permit now?
          </div>
          <button
            onClick={onRunCounterfactual}
            className="text-[12px] font-medium bg-panel2 border border-border rounded-md px-3 py-1.5 hover:border-amber hover:text-amber transition-colors"
          >
            Run counterfactual
          </button>
          {counterfactual && (
            <div className="flex justify-between items-center mt-3 font-mono text-[13px]">
              <span className="text-text2">{Math.round(counterfactual.before * 100)}% current</span>
              <span className="text-text3">→</span>
              <span className="text-safe font-semibold">{Math.round(counterfactual.after * 100)}% if revoked</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
