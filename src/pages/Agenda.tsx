import { useState, useMemo } from "react"
import { useApp } from "../context/AppContext"
import { ContratoDetailModal } from "../components/Dashboard/ContratoDetailModal"

type FiltroStatus = "todas" | "hoje" | "atrasadas" | "futuras"

function formatValor(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`
}

function gerarLinkWhatsApp(telefone: string, texto: string) {
  const digits = telefone.replace(/\D/g, "")
  return `https://api.whatsapp.com/send?phone=55${digits}&text=${encodeURIComponent(texto)}`
}

function dispararLog(evento: string) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
  window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[NOTIFY_INFO] ${time} — ${evento}` }))
}

function hojeStr() {
  return new Date().toLocaleDateString("pt-BR")
}

function parseDataBr(data: string) {
  const [d, m, a] = data.split("/").map(Number)
  return new Date(a, m - 1, d)
}

function diffDias(dataStr: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = parseDataBr(dataStr)
  alvo.setHours(0, 0, 0, 0)
  return Math.floor((hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24))
}

export function Agenda() {
  const { contratos } = useApp()
  const [filtro, setFiltro] = useState<FiltroStatus>("todas")
  const [contratoDetalhe, setContratoDetalhe] = useState<string | null>(null)

  const parcelas = useMemo(() => {
    const result: {
      id: string
      nome: string
      contratoId: string
      telefone: string
      parcelaLabel: string
      parcelaNum: number
      parcelaTotal: number
      valor: number
      vencimento: string
      status: "hoje" | "atrasada" | "futura"
    }[] = []

    const hoje = hojeStr()

    for (const c of contratos) {
      for (const p of c.parcelas) {
        const diff = diffDias(p.vencimento)
        let status: "hoje" | "atrasada" | "futura"
        if (p.vencimento === hoje) status = "hoje"
        else if (diff > 0) status = "atrasada"
        else status = "futura"

        result.push({
          id: `${c.id}-p${p.numero}`,
          nome: c.nome,
          contratoId: c.id,
          telefone: c.telefone,
          parcelaLabel: `${p.numero}ª/${c.numParcelas}`,
          parcelaNum: p.numero,
          parcelaTotal: c.numParcelas,
          valor: p.valor,
          vencimento: p.vencimento,
          status,
        })
      }
    }
    return result
  }, [contratos])

  const parcelasFiltradas = parcelas.filter((p) => {
    if (filtro === "todas") return true
    return p.status === filtro
  })

  const totalPrevisto = parcelas
    .filter((p) => p.status === "hoje" || p.status === "futura")
    .reduce((s, p) => s + p.valor, 0)

  function notificarVencimento(p: (typeof parcelas)[0]) {
    const msg = `Olá, ${p.nome}. Passando para lembrar que a sua parcela nº ${p.parcelaLabel} no valor de ${formatValor(p.valor)} vence hoje (${p.vencimento}). Para sua comodidade e para evitar a ativação automática de taxas de mora e multas diárias no sistema, realize o acerto via chave Pix. Confirmando o pagamento, envie o comprovante por aqui. Obrigado!`
    window.open(gerarLinkWhatsApp(p.telefone, msg), "_blank")
    dispararLog(`Disparo de Notificação de Vencimento enviado para ${p.nome} via WhatsApp (ID: ${p.contratoId}).`)
  }

  function notificarAtraso(p: (typeof parcelas)[0]) {
    const diasAtraso = diffDias(p.vencimento)
    const multaDiaria = p.valor * 0.01
    const totalMulta = multaDiaria * diasAtraso
    const valorCorrigido = p.valor + totalMulta
    const msg = `AVISO DE INADIMPLÊNCIA: Consta no sistema CORE-BANK que a sua parcela de ${formatValor(p.valor)} está em atraso há ${diasAtraso} dias. Conforme cláusula contratual assinalada, foram aplicados juros de mora acumulados mais a multa diária de ${formatValor(multaDiaria)}, totalizando o valor atualizado de ${formatValor(valorCorrigido)} para quitação imediata. Evite restrições internas na banca. Aguardamos o comprovante do Pix urgente.`
    window.open(gerarLinkWhatsApp(p.telefone, msg), "_blank")
    dispararLog(`Disparo de Notificação de Atraso enviado para ${p.nome} via WhatsApp (ID: ${p.contratoId}). ${diasAtraso} dias em atraso, multa acumulada: ${formatValor(totalMulta)}.`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Agenda de Recebimentos / Central de Notificações</h2>
        <span className="text-[10px] text-[#666] font-mono">SESSÃO ATIVA</span>
      </div>

      {/* Resumo */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="text-[#666]">Total a receber:</span>
        <span className="text-[#00e55b] font-[700]">{formatValor(totalPrevisto)}</span>
        <span className="text-[#666]">|</span>
        <span className="text-[#666]">{parcelas.filter((p) => p.status === "hoje").length} vencendo hoje</span>
        <span className="text-[#FF3838]">{parcelas.filter((p) => p.status === "atrasada").length} em atraso</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["todas", "hoje", "atrasadas", "futuras"] as const).map((f) => {
          const labelMap: Record<FiltroStatus, string> = {
            todas: "Todas as Parcelas",
            hoje: "Vencendo Hoje",
            atrasadas: "Atrasadas",
            futuras: "Agendadas/Futuras",
          }
          const colorMap: Record<FiltroStatus, string> = {
            todas: "border-zinc-700 text-[#e0e0e0]",
            hoje: "border-[#00e55b]/40 text-[#00e55b] bg-[#00e55b]/5",
            atrasadas: "border-[#FF3838]/40 text-[#FF3838] bg-[#FF3838]/5",
            futuras: "border-zinc-600/40 text-zinc-400 bg-zinc-800/30",
          }
          const isActive = filtro === f
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg border font-mono text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? `${colorMap[f]} ring-1 ${f === "todas" ? "ring-zinc-600" : f === "hoje" ? "ring-[#00e55b]/30" : f === "atrasadas" ? "ring-[#FF3838]/30" : "ring-zinc-500/30"}`
                  : "border-zinc-800 text-[#666] hover:border-zinc-600"
              }`}
            >
              {labelMap[f]}
            </button>
          )
        })}
      </div>

      {/* Listagem */}
      <div className="space-y-3">
        {parcelasFiltradas.map((p) => {
          const isAtrasada = p.status === "atrasada"
          const isHoje = p.status === "hoje"
          const diasAtraso = isAtrasada ? diffDias(p.vencimento) : 0
          const multaDiaria = p.valor * 0.01
          const totalMulta = isAtrasada ? multaDiaria * diasAtraso : 0
          const valorCorrigido = isAtrasada ? p.valor + totalMulta : p.valor

          const telefoneDisplay = p.telefone.replace(/\D/g, "")
          const telFormatado = telefoneDisplay.length >= 10
            ? `(${telefoneDisplay.slice(0, 2)}) ${telefoneDisplay.slice(2, 7)}-${telefoneDisplay.slice(7, 11)}`
            : p.telefone

          return (
            <div
              key={p.id}
              className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => setContratoDetalhe(p.contratoId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[#e0e0e0] font-mono truncate">
                    {p.nome}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                    isAtrasada
                      ? "border-[#FF3838]/40 text-[#FF3838] bg-[#FF3838]/10"
                      : isHoje
                        ? "border-[#00e55b]/40 text-[#00e55b] bg-[#00e55b]/10"
                        : "border-zinc-600/40 text-zinc-400 bg-zinc-800/30"
                  }`}>
                    {isAtrasada ? `${diasAtraso}d ATRASO` : isHoje ? "VENCE HOJE" : "AGENDADA"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[#666] font-mono">
                  <span>ID: {p.contratoId}</span>
                  <span>Tel: {telFormatado}</span>
                  <span>Parcela {p.parcelaLabel}</span>
                  <span>Venc: {p.vencimento}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  {isAtrasada ? (
                    <>
                      <p className="text-sm text-[#FF3838] font-mono font-[700]">{formatValor(valorCorrigido)}</p>
                      <p className="text-[10px] text-[#FF3838]/70 font-mono">Base: {formatValor(p.valor)} + {formatValor(totalMulta)} multa</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[#00e55b] font-mono font-[700]">{formatValor(p.valor)}</p>
                      <p className="text-[10px] text-[#666] font-mono">{p.parcelaLabel}</p>
                    </>
                  )}
                </div>

                {isAtrasada ? (
                  <button
                    onClick={() => notificarAtraso(p)}
                    className="px-4 py-2 text-xs font-mono font-[600] text-[#FF3838] border border-[#FF3838]/30 rounded-lg hover:bg-[#FF3838]/10 transition-colors whitespace-nowrap animate-pulse"
                  >
                    🚨 COBRANÇA DE ATRASO
                  </button>
                ) : isHoje ? (
                  <button
                    onClick={() => notificarVencimento(p)}
                    className="px-4 py-2 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/30 rounded-lg hover:bg-[#00e55b]/10 transition-colors whitespace-nowrap"
                  >
                    ⚡ NOTIFICAR VENCIMENTO
                  </button>
                ) : (
                  <button
                    onClick={() => notificarVencimento(p)}
                    className="px-4 py-2 text-xs font-mono font-[600] text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 transition-colors whitespace-nowrap"
                  >
                    ⚡ NOTIFICAR VENCIMENTO
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {parcelasFiltradas.length === 0 && (
          <p className="text-xs text-[#666] font-mono text-center py-8">
            Nenhuma parcela encontrada para este filtro.
          </p>
        )}
      </div>

      <ContratoDetailModal
        contratoId={contratoDetalhe}
        onClose={() => setContratoDetalhe(null)}
      />
    </div>
  )
}
