import { useState, useEffect, useRef } from "react"

export function SystemLogs() {
  const [logs, setLogs] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setLogs((prev) => [detail as string, ...prev].slice(0, 50))
    }
    window.addEventListener("corebank:log", handler)
    return () => window.removeEventListener("corebank:log", handler)
  }, [])

  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = 0
  }, [open, logs])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono text-[#00e55b] bg-zinc-950/90 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">terminal</span>
        LOGS {logs.length > 0 && <span className="text-[#FF3838]">({logs.length})</span>}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-[420px] max-h-[300px] bg-zinc-950/95 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-[10px] text-[#666] font-mono uppercase tracking-wider">System Log</span>
            <button onClick={() => setLogs([])} className="text-[10px] text-[#666] font-mono hover:text-[#e0e0e0] transition-colors">
              Limpar
            </button>
          </div>
          <div ref={ref} className="overflow-y-auto max-h-[260px] p-2 space-y-1">
            {logs.length === 0 && (
              <p className="text-[10px] text-[#555] font-mono italic text-center py-4">Nenhum evento registrado</p>
            )}
            {logs.map((log, i) => (
              <p key={i} className="text-[10px] font-mono text-[#999] leading-relaxed break-all">
                {log}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
