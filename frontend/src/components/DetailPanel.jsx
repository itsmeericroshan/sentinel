function FactorRow({ label, value, color, isFlag, flagVal }) {
  if (isFlag) return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-none text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono font-semibold text-sm ${flagVal ? 'text-red-600' : 'text-gray-400'}`}>
        {flagVal ? 'YES' : 'no'}
      </span>
    </div>
  )
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-none text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-gray-800 text-sm w-8 text-right">{Math.round(value)}</span>
        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
        </div>
      </div>
    </div>
  )
}

export default function DetailPanel({ zoneName, detail, counterfactual, onRunCounterfactual, onEmergencyReport, reportLoading }) {
  if (!detail) return (
    <div className="text-center py-8 text-gray-400 text-sm">
      <div className="text-3xl mb-2">👆</div>
      Click any zone on the map to inspect its live risk factors.
    </div>
  )

  const { readings, risk, baseline_flag } = detail
  const riskColor = risk >= 0.65 ? '#CC0000' : risk >= 0.4 ? '#D97706' : '#16A34A'
  const riskLabel = risk >= 0.65 ? 'CRITICAL' : risk >= 0.4 ? 'ELEVATED' : 'NOMINAL'
  const riskBg = risk >= 0.65 ? 'bg-red-50 border-red-200' : risk >= 0.4 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'

  return (
    <div>
      <div className={`flex justify-between items-center mb-4 p-3 rounded-lg border ${riskBg}`}>
        <span className="font-bold text-gray-900">{riskLabel}</span>
        <span className="font-mono text-2xl font-bold" style={{ color: riskColor }}>
          {Math.round(risk * 100)}%
        </span>
      </div>

      <FactorRow label="Gas / atmospheric pressure" value={readings.gas} color="#CC0000" />
      <FactorRow label="Ventilation deficit" value={100 - readings.vent} color="#D97706" />
      <FactorRow label="Hot-work permit active" isFlag flagVal={readings.permit} />
      <FactorRow label="Maintenance activity" isFlag flagVal={readings.maint} />
      <FactorRow label="Worker proximity" value={readings.prox} color="#1D4ED8" />

      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
        <span>Single-sensor baseline flags this</span>
        <span className="font-mono">{baseline_flag ? 'YES' : 'no'}</span>
      </div>

      {readings.permit === 1 && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Counterfactual — what if the active permit were revoked?
          </div>
          <button onClick={onRunCounterfactual}
            className="w-full bg-gray-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Run Counterfactual Analysis
          </button>
          {counterfactual && (
            <div className="mt-3 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-center">
                <div className="font-mono text-xl font-bold text-red-600">{Math.round(counterfactual.before * 100)}%</div>
                <div className="text-[10px] text-gray-400">Current</div>
              </div>
              <div className="text-2xl text-gray-300">→</div>
              <div className="text-center">
                <div className="font-mono text-xl font-bold text-green-600">{Math.round(counterfactual.after * 100)}%</div>
                <div className="text-[10px] text-gray-400">If revoked</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xl font-bold text-gray-900">-{Math.round(counterfactual.delta * 100)}%</div>
                <div className="text-[10px] text-gray-400">Reduction</div>
              </div>
            </div>
          )}
        </div>
      )}

      {risk >= 0.65 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Emergency Response Orchestrator
          </div>
          <button
            onClick={onEmergencyReport}
            disabled={reportLoading}
            className="w-full bg-red-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {reportLoading
              ? '⏳ Generating Report...'
              : '🚨 Generate Emergency Incident Report (PDF)'}
          </button>
          <div className="text-xs text-gray-400 mt-1.5 text-center">
            Auto-generates a regulatory-compliant incident report per OISD/Factory Act
          </div>
        </div>
      )}
    </div>
  )
}
