export default function CitationPanel({ citations }) {
  if (!citations || citations.length === 0) {
    return (
      <div className="text-text3 text-[12.5px]">
        Select a zone with elevated risk to retrieve the relevant clause and nearest precedent.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {citations.map((c, i) => (
        <div key={i} className="bg-panel2 border-l-2 border-accent rounded-r-md px-3.5 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-text3 mb-1">{c.type}</div>
          <div className="text-[12.5px] leading-relaxed text-text2">{c.text}</div>
        </div>
      ))}
    </div>
  )
}
