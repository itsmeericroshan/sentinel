import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import ZoneMap from './components/ZoneMap.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import AgentPanel from './components/AgentPanel.jsx'
import CitationPanel from './components/CitationPanel.jsx'
import AlertLog from './components/AlertLog.jsx'

export default function App() {
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
    const z = await api.zones()
    setZones(z.zones)
    setTick(z.tick)
    const d = await api.zoneDetail(selected)
    setDetail(d)
    const ag = await api.agents(selected)
    setAgentData(ag)
    const cit = await api.citation(selected)
    setCitations(cit.results)
    const al = await api.alerts()
    setAlerts(al.alerts)
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      await api.tick()
      refreshAll()
    }, 2500)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  async function handleSelect(id) {
    setSelected(id)
    setCounterfactual(null)
  }

  async function handleCounterfactual() {
    const cf = await api.counterfactual(selected)
    setCounterfactual(cf)
  }

  async function handleAck(id) {
    await api.ackAlert(id)
    const al = await api.alerts()
    setAlerts(al.alerts)
  }

  async function handleReplay() {
    if (replaying) return
    setReplaying(true)
    setSelected('cobA')
    setReplayMsg('Replaying compound-risk incident on Coke Oven Battery A — accelerated timeline.')
    clearInterval(intervalRef.current)

    await api.tick(25)
    let t = 25
    let flaggedAt = null

    intervalRef.current = setInterval(async () => {
      const res = await api.tick()
      t = res.tick
      const d = await api.zoneDetail('cobA')
      if (flaggedAt === null && d.risk >= 0.65) flaggedAt = t
      await refreshAll()

      if (t >= 55) {
        clearInterval(intervalRef.current)
        setReplaying(false)
        const lead = flaggedAt !== null ? t - flaggedAt : 0
        setReplayMsg(
          flaggedAt !== null
            ? `SENTINEL flagged this pattern at t=${flaggedAt} — full compound conditions only emerged at t=${t}. Lead time: ${lead} ticks before a single-sensor system would have reacted.`
            : 'Replay complete.'
        )
        intervalRef.current = setInterval(async () => {
          await api.tick()
          refreshAll()
        }, 2500)
      }
    }, 200)
  }

  const maxRisk = zones.length ? Math.max(...zones.map((z) => z.risk)) : 0
  const statusLabel = maxRisk >= 0.65 ? 'Critical — action required' : maxRisk >= 0.4 ? 'Elevated' : 'Nominal'
  const statusColor = maxRisk >= 0.65 ? 'bg-danger' : maxRisk >= 0.4 ? 'bg-amber' : 'bg-safe'

  return (
    <div className="min-h-screen p-6">
      <header className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-4 mb-5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-display text-[22px] font-bold tracking-wide">SENTINEL</h1>
          <span className="text-[12px] text-text3">Compound risk intelligence · Coke oven battery complex</span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 bg-panel border border-border rounded-lg px-4 py-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-text3">Plant status</div>
              <div className="text-[15px] font-semibold">{statusLabel}</div>
            </div>
          </div>
          <button
            onClick={handleReplay}
            disabled={replaying}
            className="text-[12px] font-medium bg-panel2 border border-border rounded-md px-3 py-2 hover:border-amber hover:text-amber transition-colors disabled:opacity-40"
          >
            ▶ Replay compound-risk incident
          </button>
        </div>
      </header>

      {replayMsg && (
        <div className="mb-4 px-4 py-2.5 bg-[#5A4017] border border-amber rounded-lg text-[12.5px] text-[#F8DBA5]">
          {replayMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="space-y-5">
          <div className="bg-panel border border-border rounded-xl p-4.5">
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="text-[14px] font-semibold uppercase tracking-wide text-text2">Geospatial risk map</h2>
              <span className="font-mono text-[11px] text-text3">t = {String(tick).padStart(2, '0')}</span>
            </div>
            <ZoneMap zones={zones} selected={selected} onSelect={handleSelect} />
          </div>

          <div className="bg-panel border border-border rounded-xl p-4.5">
            <h2 className="text-[14px] font-semibold uppercase tracking-wide text-text2 mb-3.5">
              Active alerts &amp; SLA escalation
            </h2>
            <AlertLog alerts={alerts} onAck={handleAck} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-panel border border-border rounded-xl p-4.5">
            <h2 className="text-[14px] font-semibold uppercase tracking-wide text-text2 mb-3.5">
              {detail ? zones.find((z) => z.id === selected)?.name : 'Select a zone'}
            </h2>
            <DetailPanel
              zoneName={selected}
              detail={detail}
              counterfactual={counterfactual}
              onRunCounterfactual={handleCounterfactual}
            />
          </div>

          <div className="bg-panel border border-border rounded-xl p-4.5">
            <h2 className="text-[14px] font-semibold uppercase tracking-wide text-text2 mb-3.5">
              Multi-agent disagreement layer
            </h2>
            <AgentPanel agentData={agentData} />
          </div>

          <div className="bg-panel border border-border rounded-xl p-4.5">
            <h2 className="text-[14px] font-semibold uppercase tracking-wide text-text2 mb-3.5">
              Regulatory grounding (RAG)
            </h2>
            <CitationPanel citations={citations} />
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-text3 mt-7">
        SENTINEL — built for ET AI Hackathon 2026. Synthetic data for demonstration.
      </footer>
    </div>
  )
}
