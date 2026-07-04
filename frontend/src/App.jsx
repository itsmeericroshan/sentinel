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

  async function handleReplay() {
    if (replaying) return
    setReplaying(true); setSelected('cobA')
    setReplayMsg('Replaying compound-risk incident on Coke Oven Battery A — accelerated timeline.')
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
          ? `✓ SENTINEL flagged at t=${flaggedAt} — full danger only at t=${t}. Lead time: ${lead} ticks ahead of single-sensor systems.`
          : 'Replay complete.')
        intervalRef.current = setInterval(async () => { await api.tick(); refreshAll() }, 2500)
      }
    }, 200)
  }

  const maxRisk = zones.length ? Math.max(...zones.map(z => z.risk)) : 0
  const statusLabel = maxRisk >= 0.65 ? 'Critical — Action Required' : maxRisk >= 0.4 ? 'Elevated' : 'Nominal'
  const statusColor = maxRisk >= 0.65 ? 'bg-red-600 text-white' : maxRisk >= 0.4 ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
  const selectedZoneName = zones.find(z => z.id === selected)?.name || 'Select a zone'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${statusColor}`}>● {statusLabel}</div>
          <span className="font-mono text-xs text-gray-400 bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg">t = {String(tick).padStart(2,'0')}</span>
        </div>
        <button onClick={handleReplay} disabled={replaying}
          className="bg-gray-900 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40">
          ▶ Replay Compound-Risk Incident
        </button>
      </div>

      {replayMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl border text-sm font-medium
          ${replayMsg.startsWith('✓') ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
          {replayMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="space-y-5">
          <Card title="Geospatial Risk Map" badge={`t = ${String(tick).padStart(2,'0')}`}>
            <ZoneMap zones={zones} selected={selected} onSelect={handleSelect} />
          </Card>
          <Card title="Active Alerts & SLA Escalation">
            <AlertLog alerts={alerts} onAck={handleAck} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card title={selectedZoneName}>
            <DetailPanel zoneName={selected} detail={detail} counterfactual={counterfactual} onRunCounterfactual={handleCounterfactual} />
          </Card>
          <Card title="Multi-Agent Disagreement Layer">
            <AgentPanel agentData={agentData} />
          </Card>
          <Card title="Regulatory Grounding (RAG)">
            <CitationPanel citations={citations} />
          </Card>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-400">SENTINEL — built for ET AI Hackathon 2026. Synthetic data for demonstration.</div>
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
