export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">ET AI Hackathon 2026 — Track 1</div>
        <h1 style={{fontFamily:'Georgia,serif', fontSize:'48px', fontWeight:'900', color:'#1A1A1A', letterSpacing:'0.08em'}}>SENTINEL</h1>
        <p className="text-gray-500 mt-2 text-lg">AI-Powered Industrial Safety Intelligence for Zero-Harm Operations</p>
      </div>

      <div className="bg-gray-900 text-white rounded-2xl p-8 mb-8">
        <h2 className="text-red-400 font-bold text-xl mb-3">The Problem</h2>
        <p className="text-gray-300 leading-relaxed mb-3">In January 2025, eight workers died at the Visakhapatnam Steel Plant coke-oven battery — a facility with functioning gas detectors, permit-to-work controls, and SCADA systems. The sensors worked. The data existed. Nobody connected it in time.</p>
        <p className="text-gray-300 leading-relaxed">This pattern — <span className="text-white font-semibold">data present, but unacted upon</span> — repeats itself across Indian heavy industry. SENTINEL closes that gap.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {val:'6,500+', label:'Fatal workplace accidents in India FY2023'},
          {val:'8', label:'Workers killed at Vizag Steel Plant, Jan 2025'},
          {val:'60%', label:'Facilities relying on manual safety handoffs'},
          {val:'0', label:'Unified AI intelligence layers in Indian heavy industry'},
        ].map((s,i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <div style={{fontSize:'32px', fontWeight:'900', color:'#CC0000', fontFamily:'Georgia,serif'}}>{s.val}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-xl text-gray-900 mb-4">What Makes SENTINEL Different</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {[
          {icon:'🧠', name:'Causal Bayesian Network', desc:'pgmpy DAG detects compound risk — not just single-sensor thresholds.'},
          {icon:'⚡', name:'Counterfactual Engine', desc:'"If this permit were revoked now, risk drops from 97% to 12%." Actionable, not just a warning.'},
          {icon:'🤖', name:'Multi-Agent Disagreement', desc:'4 specialist agents score independently. High variance = novel pattern = escalate.'},
          {icon:'📋', name:'RAG Regulatory Layer', desc:'Every alert grounded in OISD/Factory Act citations and historical precedents.'},
          {icon:'🚨', name:'SLA Escalation Engine', desc:'Unacknowledged alerts auto-escalate — closing the gap that cost lives at Vizag.'},
          {icon:'🗺️', name:'Geospatial Risk Map', desc:'Live plant-wide heatmap. Click any zone for full causal breakdown.'},
        ].map((t,i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-red-300 transition-colors">
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="font-semibold text-gray-900 mb-1">{t.name}</div>
            <div className="text-sm text-gray-500">{t.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-xl text-gray-900 mb-4">Judging Criteria</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 mb-8">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-900 text-white">
            <th className="text-left px-5 py-3">Criterion</th>
            <th className="text-left px-5 py-3">Weight</th>
            <th className="text-left px-5 py-3">How SENTINEL addresses it</th>
          </tr></thead>
          <tbody>
            {[
              {c:'Innovation',w:'25%',h:'Causal counterfactual + agent-disagreement-as-signal'},
              {c:'Business Impact',w:'25%',h:'Replay shows actual lead time vs single-sensor baseline'},
              {c:'Technical Excellence',w:'20%',h:'Real pgmpy, real multi-agent API, real vector retrieval'},
              {c:'Scalability',w:'15%',h:'Zones are config-driven — adding a plant is one line'},
              {c:'User Experience',w:'15%',h:'Live heatmap, counterfactuals, SLA escalation'},
            ].map((row,i) => (
              <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-5 py-3 font-semibold text-gray-900">{row.c}</td>
                <td className="px-5 py-3 text-red-600 font-bold">{row.w}</td>
                <td className="px-5 py-3 text-gray-500">{row.h}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center text-sm text-gray-400 border-t border-gray-200 pt-6">Built for ET AI Hackathon 2026 · Track 1: Industrial Safety Intelligence · Synthetic data for demonstration.</div>
    </div>
  )
}
