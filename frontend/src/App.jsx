import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import Navbar from './components/Navbar.jsx'
import ZoneMap from './components/ZoneMap.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import AgentPanel from './components/AgentPanel.jsx'
import CitationPanel from './components/CitationPanel.jsx'
import AlertLog from './components/AlertLog.jsx'
import AboutPage from './components/AboutPage.jsx'
import HowItWorksPage from './components/HowItWorksPage.jsx'

function GuidedTour() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-6 mb-6 relative">
      <button onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">×</button>
      <div style={{color:'#FF3333',fontFamily:'Georgia,serif',fontSize:'18px',fontWeight:'900',letterSpacing:'0.05em'}} className="mb-4">
        HOW TO USE THIS DASHBOARD
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {step:'01',title:'Watch the live map',desc:'The 6 zone cards update every 2.5 seconds — simulating real plant sensor data (gas, ventilation, permits, worker proximity). Green = safe. Red = critical.'},
          {step:'02',title:'Click any zone',desc:'Click a zone card to see its full causal breakdown — exactly which sensor combination is driving the risk score, and whether a single-sensor system would have caught it.'},
          {step:'03',title:'Run the replay',desc:'Click "Replay Compound-Risk Incident" — watch SENTINEL detect the Vizag-pattern danger on Coke Oven Battery A before full compound conditions emerge. See the lead time live.'},
          {step:'04',title:'Generate incident report',desc:'When a zone hits Critical, click the red Emergency Report button to auto-generate a regulatory-compliant PDF incident report instantly.'},
        ].map((s,i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4">
            <div style={{color:'#FF3333',fontFamily:'Georgia,serif',fontSize:'24px',fontWeight:'900'}}>{s.step}</div>
            <div className="font-semibold text-white text-sm mt-1 mb-2">{s.title}</div>
            <div className="text-gray-400 text-xs leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
        ⚠ This is a prototype using <strong className="text-gray-300">synthetic simulated data</strong> — no real sensors are connected. The risk engine, agent scoring, counterfactual analysis, SLA escalation, and PDF report generation are all real working code.
      </div>
    </div>
  )
}

function Card({ title, badge, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-800">{title}</h2>
        {badge && <span className="text-xs font-mono text-gray-400">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Dashboard() {
  const [zones, setZones] = useState([])
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState('cobA')
  const [detail, setDetail] = useState(null)
  const [counterfactual, setCounterfactual] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [citations, setCitations] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [replaying, setReplaying] = useState(false)
  const [replayMsg, setReplayMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const intervalRef = useRef(null)

  async function refreshAll() {
    try {
      const [z, d, ag, cit, al] = await Promise.all([
        api.zones(), api.zoneDetail(selected),
        api.agents(selected), api.citation(selected), api.alerts()
      ])
      setZones(z.zones); setTick(z.tick)
      setDetail(d); setAgentData(ag)
      setCitations(cit.results); setAlerts(al.alerts)
      setLoading(false)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { refreshAll() }, [selected])

  useEffect(() => {
    intervalRef.current = setInterval(async () => { await api.tick(); refreshAll() }, 2500)
    return () => clearInterval(intervalRef.current)
  }, [selected])

  async function handleSelect(id) { setSelected(id); setCounterfactual(null) }
  async function handleCounterfactual() { const cf = await api.counterfactual(selected); setCounterfactual(cf) }
  async function handleAck(id) { await api.ackAlert(id); const al = await api.alerts(); setAlerts(al.alerts) }

  async function handleEmergencyReport() {
    setReportLoading(true)
    try {
      const data = await api.emergencyReport(selected)
      if (data.pdf_available && data.pdf_base64) {
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${data.pdf_base64}`
        link.download = data.filename || 'incident-report.pdf'
        link.click()
      } else {
        alert(`Report generated: ${data.report.report_id}\nSeverity: ${data.report.severity}\nActions:\n${data.report.actions.slice(0,3).join('\n')}`)
      }
    } catch(e) { alert('Report generation failed: ' + e.message) }
    finally { setReportLoading(false) }
  }

  async function handleReplay() {
    if (replaying) return
    setReplaying(true); setSelected('cobA')
    setReplayMsg('▶ Replaying compound-risk incident on Coke Oven Battery A — watch the risk score climb on the map...')
    clearInterval(intervalRef.current)
    await api.tick(25)
    let t = 25, flaggedAt = null
    intervalRef.current = setInterval(async () => {
      const res = await api.tick(); t = res.tick
      const d = await api.zoneDetail('cobA')
      if (flaggedAt === null && d.risk >= 0.65) flaggedAt = t
      await refreshAll()
      if (t >= 55) {
        clearInterval(intervalRef.current); setReplaying(false)
        const lead = flaggedAt !== null ? t - flaggedAt : 0
        setReplayMsg(flaggedAt !== null
          ? `✓ SENTINEL flagged the danger at t=${flaggedAt}. Full compound conditions only emerged at t=${t}. That is ${lead} ticks of lead time — time that could have saved lives at Vizag.`
          : 'Replay complete.')
        intervalRef.current = setInterval(async () => { await api.tick(); refreshAll() }, 2500)
      }
    }, 200)
  }

  const maxRisk = zones.length ? Math.max(...zones.map(z => z.risk)) : 0
  const statusLabel = maxRisk >= 0.65 ? 'Critical — Action Required' : maxRisk >= 0.4 ? 'Elevated' : 'Nominal'
  const statusColor = maxRisk >= 0.65 ? 'bg-red-600 text-white' : maxRisk >= 0.4 ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
  const selectedZoneName = zones.find(z => z.id === selected)?.name || 'Select a zone'

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      <div className="text-gray-500 text-sm">Connecting to SENTINEL backend...</div>
      <div className="text-gray-400 text-xs">First load may take 30–60 seconds while the backend wakes up</div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <GuidedTour />

      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${statusColor}`}>● {statusLabel}</div>
          <span className="font-mono text-xs text-gray-400 bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg">
            Simulated clock: t = {String(tick).padStart(2,'0')} / 60
          </span>
        </div>
        <button onClick={handleReplay} disabled={replaying}
          className="bg-gray-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 flex items-center gap-2">
          {replaying ? '⏳ Replaying...' : '▶ Replay Compound-Risk Incident'}
        </button>
      </div>

      {replayMsg && (
        <div className={`mb-5 px-5 py-4 rounded-xl border text-sm font-medium leading-relaxed
          ${replayMsg.startsWith('✓') ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
          {replayMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="space-y-5">
          <Card title="Geospatial Risk Map — 6 Plant Zones" badge={`t = ${String(tick).padStart(2,'0')}`}>
            <p className="text-xs text-gray-400 mb-3">Each zone updates every 2.5 seconds from the simulated sensor engine. Click any zone to inspect it.</p>
            <ZoneMap zones={zones} selected={selected} onSelect={handleSelect} />
          </Card>
          <Card title="Active Alerts & SLA Escalation">
            <p className="text-xs text-gray-400 mb-3">When compound risk crosses 65%, an alert fires. Acknowledge within the SLA window — or it auto-escalates.</p>
            <AlertLog alerts={alerts} onAck={handleAck} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title={`Zone Detail — ${selectedZoneName}`}>
            <p className="text-xs text-gray-400 mb-3">Causal breakdown of what is driving this zone's risk score. Use "Run Counterfactual" to see what one intervention would change.</p>
            <DetailPanel
              zoneName={selected}
              detail={detail}
              counterfactual={counterfactual}
              onRunCounterfactual={handleCounterfactual}
              onEmergencyReport={handleEmergencyReport}
              reportLoading={reportLoading}
            />
          </Card>
          <Card title="Multi-Agent Disagreement Layer">
            <p className="text-xs text-gray-400 mb-3">4 specialist agents score independently. High variance between them = novel dangerous pattern never seen before.</p>
            <AgentPanel agentData={agentData} />
          </Card>
          <Card title="Regulatory Grounding (RAG)">
            <p className="text-xs text-gray-400 mb-3">Every alert is automatically matched to the nearest OISD/Factory Act clause and historical precedent.</p>
            <CitationPanel citations={citations} />
          </Card>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        SENTINEL — built for ET AI Hackathon 2026 · Synthetic simulated data · Real causal engine, real agents, real RAG
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  return (
    <div className="min-h-screen bg-white">
      <Navbar page={page} setPage={setPage} />
      {page === 'dashboard' && <Dashboard />}
      {page === 'how' && <HowItWorksPage />}
      {page === 'about' && <AboutPage />}
    </div>
  )
}
