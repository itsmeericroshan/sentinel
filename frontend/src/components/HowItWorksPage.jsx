export default function HowItWorksPage() {
  const steps = [
    { num:'01', title:'Data Ingestion', desc:'Continuously ingests sensor streams — gas pressure, temperature, CO/H2S levels, permit-to-work logs, shift rosters, and maintenance records. OCR processes scanned paper permits automatically.', note:'Prototype uses a synthetic generator simulating 60-tick plant timelines with injected compound-risk patterns modeled on the Vizag incident.' },
    { num:'02', title:'Causal Risk Engine', desc:'A Bayesian causal network over five factors — gas pressure, ventilation, active permits, maintenance, and worker proximity — computes compound risk. When gas + open permit + degraded ventilation co-occur, a 1.6× compound multiplier fires that no single threshold catches.', note:'Core differentiator: detects dangerous combinations, not just individual threshold breaches.' },
    { num:'03', title:'Multi-Agent Disagreement', desc:'Four specialist AI agents independently score risk from their own data slice. A coordinator measures variance. High variance + moderate mean = novel pattern never seen before → escalate immediately.', note:'Ensemble disagreement as a signal, not noise. Catches unprecedented combinations no trained rule would flag.' },
    { num:'04', title:'Counterfactual Analysis', desc:'When risk is elevated and a hot-work permit is active, the system computes: "if this permit were revoked right now, how would risk change?" Gives safety officers an actionable intervention, not just a warning number.', note:'Click "Run counterfactual" on any high-risk zone in the dashboard to see this live.' },
    { num:'05', title:'RAG Regulatory Grounding', desc:'ChromaDB retrieves the most relevant OISD/Factory Act regulatory clause and the closest historical near-miss precedent for each elevated-risk state. Every alert cites evidence.', note:'Every alert in the dashboard shows its regulatory grounding automatically.' },
    { num:'06', title:'SLA Escalation', desc:'When a compound-risk alert fires, a countdown starts. If no officer acknowledges within the SLA window, the system auto-escalates — triggering emergency protocols rather than silently waiting.', note:'Watch the countdown in Active Alerts. Click Acknowledge before zero — or watch it escalate.' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-bold text-4xl text-gray-900 mb-3">How SENTINEL Works</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Six stages — from raw sensor data to a cited, escalating safety intervention — in seconds.</p>
      </div>

      <div className="space-y-6">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg">{s.num}</div>
            <div className="flex-1 border-l-4 border-red-500 bg-gray-50 rounded-r-xl p-5">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{s.desc}</p>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs text-red-600 font-medium">→ {s.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-900 text-white rounded-2xl p-8 text-center">
        <div style={{fontFamily:'Georgia,serif', fontSize:'32px', fontWeight:'900', color:'#FF3333', letterSpacing:'0.1em'}} className="mb-3">THE VIZAG REPLAY</div>
        <p className="text-gray-300 max-w-lg mx-auto mb-5 text-sm leading-relaxed">Go to the Live Dashboard and click <strong className="text-white">"Replay compound-risk incident"</strong>. Watch SENTINEL flag the dangerous pattern before full compound conditions emerge — with a live lead-time counter showing how many ticks earlier it acted vs a single-sensor system.</p>
        <div className="inline-block bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold">That lead time is what saves lives.</div>
      </div>
    </div>
  )
}
