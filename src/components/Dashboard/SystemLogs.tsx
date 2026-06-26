import { useEffect, useRef, useState } from "react"

const levels = [
  { prefix: "[INFO]", color: "text-[#00e55b]" },
  { prefix: "[AUTH]", color: "text-[#666]" },
  { prefix: "[DATA]", color: "text-[#666]" },
  { prefix: "[WARN]", color: "text-[#ffb4ab]" },
  { prefix: "[LOGS]", color: "text-[#666]" },
  { prefix: "[LIVE]", color: "text-[#00e55b]" },
]

const initialLogs = [
  "[INFO] 14:22:01 — Conexão segura estabelecida via VPN_W_02",
  "[AUTH] 14:22:04 — Login verificado: OPERADOR_ALPHA (LEVEL-04)",
  "[DATA] 14:22:08 — Sincronizando carteira \"COMER_BRAZIL_SOUTH\"...",
  "[WARN] 14:22:15 — Inadimplência detectada em 0x14...C3B (Cláudio Chaveiro)",
  "[LIVE] 14:23:45 — Feed de transações em tempo real iniciado.",
  "[LOGS] 14:23:50 — Hash de transação: 8f92-c42a-11ee-866d-00e55b",
  "[LOGS] 14:24:02 — Hash de transação: d7e1-b31f-44aa-92cc-42b1ff",
]

export function SystemLogs() {
  const [logs, setLogs] = useState(initialLogs)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScroll = useRef(true)

  useEffect(() => {
    const handleNewLog = (e: Event) => {
      const msg = (e as CustomEvent).detail
      setLogs((prev) => {
        const next = [...prev, msg]
        return next.length > 20 ? next.slice(next.length - 20) : next
      })
    }
    window.addEventListener("corebank:log", handleNewLog)

    const interval = setInterval(() => {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
      const level = levels[Math.floor(Math.random() * levels.length)]
      const hash = Math.random().toString(16).substring(2, 15)
      const msg = `${level.prefix} ${time} — Hash-id: ${hash}`

      setLogs((prev) => {
        const next = [...prev, msg]
        return next.length > 20 ? next.slice(next.length - 20) : next
      })
    }, 3000)

    return () => {
      window.removeEventListener("corebank:log", handleNewLog)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    autoScroll.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
  }

  const getColor = (log: string) => {
    for (const l of levels) {
      if (log.startsWith(l.prefix)) return l.color
    }
    return "text-[#666]"
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-[200px] overflow-y-auto font-mono text-xs space-y-1 leading-relaxed"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#00e55b transparent" }}
    >
      {logs.map((log, i) => (
        <p key={i} className={getColor(log)}>
          {log}
        </p>
      ))}
    </div>
  )
}
