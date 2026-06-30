const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function req(path, opts) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  zones: () => req('/api/zones'),
  zoneDetail: (id) => req(`/api/zones/${id}`),
  counterfactual: (id) => req(`/api/zones/${id}/counterfactual`, { method: 'POST' }),
  agents: (id) => req(`/api/zones/${id}/agents`),
  citation: (id) => req(`/api/zones/${id}/citation`),
  tick: (resetTo) => req('/api/tick', { method: 'POST', body: JSON.stringify({ reset_to: resetTo ?? null }) }),
  alerts: () => req('/api/alerts'),
  ackAlert: (id) => req(`/api/alerts/${id}/ack`, { method: 'POST' }),
}
