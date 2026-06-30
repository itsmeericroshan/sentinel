export default function AlertLog({ alerts, onAck }) {
  if (alerts.length === 0) {
    return <div className="text-text3 text-[12.5px]">No active alerts. System monitoring nominally.</div>
  }

  return (
    <div>
      {alerts.map((a) => (
        <div
          key={a.id}
          className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center py-2.5 border-b border-border last:border-none text-[12.5px]"
        >
          <span className={`w-2 h-2 rounded-full ${a.risk >= 0.8 ? 'bg-danger' : 'bg-amber'}`} />
          <span>
            {a.zone_name} — compound risk {Math.round(a.risk * 100)}%
            <span className="text-text3 text-[11px]"> · t={a.tick}</span>
          </span>
          {!a.acked && !a.escalated && (
            <button
              onClick={() => onAck(a.id)}
              className="text-[11.5px] font-medium bg-panel2 border border-border rounded-md px-2.5 py-1 hover:border-amber hover:text-amber transition-colors"
            >
              Acknowledge
            </button>
          )}
          {a.acked || a.escalated ? <span /> : null}
          {a.acked ? (
            <span className="font-mono text-[12px] text-safe">ACK'D</span>
          ) : a.escalated ? (
            <span className="font-mono text-[12px] font-semibold text-danger">ESCALATED</span>
          ) : (
            <span className="font-mono text-[12px] text-amber">{Math.round(a.remaining_seconds)}s</span>
          )}
        </div>
      ))}
    </div>
  )
}
