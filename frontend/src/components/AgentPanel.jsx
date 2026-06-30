import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts'

export default function AgentPanel({ agentData }) {
  if (!agentData) {
    return <div className="text-text3 text-[12.5px]">Select a zone to view independent agent scores.</div>
  }

  const chartData = agentData.agents.map((a) => ({
    name: a.label.replace(' agent', ''),
    score: Math.round(a.score * 100),
  }))

  const flagStyle = {
    novel_pattern: 'bg-[#4A1F1D] border-danger text-[#FBC9C7]',
    known_pattern: 'bg-[#5A4017] border-amber text-[#F8DBA5]',
    calm: 'bg-[#163A2C] border-safe text-[#B7E4CF]',
  }[agentData.verdict]

  return (
    <div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: '#9CA0A4', fontSize: 11.5 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="score" radius={4} barSize={14}>
            {chartData.map((_, i) => (
              <Cell key={i} fill="#4B8FD8" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className={`mt-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium ${flagStyle}`}>
        {agentData.verdict === 'novel_pattern' && '⚠ '}
        {agentData.message}
      </div>
    </div>
  )
}
