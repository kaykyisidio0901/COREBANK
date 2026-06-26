import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"

export function GestaoCapital() {
  const { saldoDisponivel, capitalMinimo, tetoRisco, saldoBaixo, injetarCapital, setCapitalMinimo, setTetoRisco } = useApp()
  const navigate = useNavigate()

  const [aporteRaw, setAporteRaw] = useState("")
  const [origem, setOrigem] = useState("")
  const [capitalMinimoInput, setCapitalMinimoInput] = useState(capitalMinimo.toString())
  const [tetoRiscoInput, setTetoRiscoInput] = useState(tetoRisco.toString())

  const handleAporteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    if (raw === "") { setAporteRaw(""); return }
    const num = parseInt(raw, 10) / 100
    setAporteRaw(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const aporteNumerico = parseFloat(aporteRaw.replace(/\./g, "").replace(",", ".")) || 0

  const handleInjetar = () => {
    if (aporteNumerico <= 0) return
    injetarCapital(aporteNumerico, origem)
    setAporteRaw("")
    setOrigem("")
  }

  const handleSalvarParametros = () => {
    const novoCapital = parseInt(capitalMinimoInput.replace(/\D/g, ""), 10) || 0
    const novoTeto = parseInt(tetoRiscoInput.replace(/\D/g, ""), 10) || 0
    if (novoCapital > 0) setCapitalMinimo(novoCapital)
    if (novoTeto > 0) setTetoRisco(novoTeto)
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[RISCO] ${time} — Parâmetros de risco atualizados: Capital Mínimo R$ ${novoCapital.toFixed(2)} | Teto por Cliente R$ ${novoTeto.toFixed(2)}.` }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Terminal de Operações / Gestão de Capital</h2>
          <p className="text-[10px] text-[#666] font-mono">CONTROLE FINANCEIRO</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#666] font-mono">DISPONÍVEL</span>
          <span
            className={`text-lg font-mono font-[700] ${saldoBaixo ? "text-[#FF3838]" : "text-[#00e55b]"}`}
            style={{ filter: saldoBaixo ? "drop-shadow(0 0 8px rgba(255,56,56,0.5))" : "drop-shadow(0 0 8px rgba(0,255,102,0.5))" }}
          >
            R$ {saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Alert banner */}
      {saldoBaixo && (
        <div className="bg-[#FF3838]/10 border border-[#FF3838]/30 rounded-xl p-4 animate-pulse">
          <p className="text-sm text-[#FF3838] font-mono font-[600] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            OPERAÇÃO EM RISCO: Saldo abaixo do limite de segurança. Injete mais capital imediatamente.
          </p>
        </div>
      )}

      {/* MÓDULO 1 - INJETAR CAPITAL */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-base text-[#e0e0e0] font-mono font-[600] flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#00e55b]">add_circle</span>
          Injetar Capital
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Valor do Aporte</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={aporteRaw}
                onChange={handleAporteChange}
                placeholder="20.000,00"
                className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Origem do Recurso</label>
            <input
              type="text"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              placeholder="Ex: Lucro Retido ou Capital Próprio"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
            />
          </div>
        </div>
        <button
          onClick={handleInjetar}
          disabled={aporteNumerico <= 0}
          className="px-5 py-2.5 text-sm font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>⚡</span>
          INJETAR NO CAIXA PRINCIPAL
        </button>
      </div>

      {/* MÓDULO 2 + 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MÓDULO 2 - Alerta de Caixa Mínimo */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-base text-[#e0e0e0] font-mono font-[600] flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#FF3838]">notification_important</span>
            Alerta de Caixa Mínimo
          </h3>
          <label className="text-[10px] text-[#666] font-mono block mb-1.5">Capital Mínimo de Segurança (Gatilho de Alerta)</label>
          <div className="relative mb-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={capitalMinimoInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                setCapitalMinimoInput(v ? (parseInt(v, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "")
              }}
              placeholder="5.000,00"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#FF3838]/50 transition-colors"
            />
          </div>
          <p className="text-[10px] text-[#666] font-mono mb-4">
            {saldoBaixo
              ? "⚠️ Saldo atual está abaixo deste limite."
              : "✅ Saldo atual está dentro do limite de segurança."}
          </p>
        </div>

        {/* MÓDULO 3 - Score e Trava de Risco */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-base text-[#e0e0e0] font-mono font-[600] flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#00e55b]">psychology</span>
            Parâmetros de Risco e Score do Cliente
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#666] font-mono block mb-1.5">Teto de Risco por Novo Cliente</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tetoRiscoInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                    setTetoRiscoInput(v ? (parseInt(v, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "")
                  }}
                  placeholder="5.000,00"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSalvarParametros}
              className="w-full px-4 py-2 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors"
            >
              SALVAR PARÂMETROS DE RISCO
            </button>
          </div>

          {/* Score Preview */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Sistema de Score / Fidelidade</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-[#999]">Score Baixo</span>
                <span className="text-[10px] font-mono text-[#FF3838]">Até 100 pts</span>
                <span className="text-[10px] font-mono text-[#FF3838] border border-[#FF3838]/30 rounded px-1.5 py-0.5">Risco Alto</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-[#999]">Score Médio</span>
                <span className="text-[10px] font-mono text-[#ffb4ab]">101 a 400 pts</span>
                <span className="text-[10px] font-mono text-[#ffb4ab] border border-[#ffb4ab]/30 rounded px-1.5 py-0.5">Risco Moderado</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-[#999]">Score Elite</span>
                <span className="text-[10px] font-mono text-[#00e55b]">+400 pts</span>
                <span className="text-[10px] font-mono text-[#00e55b] border border-[#00e55b]/30 rounded px-1.5 py-0.5">Crédito Livre</span>
              </div>
              <p className="text-[10px] text-[#666] font-mono pt-1 leading-relaxed">
                A cada parcela paga em dia, o cliente ganha <span className="text-[#00e55b]">+10 pontos</span>. Conforme o score sobe, o limite de crédito para novos empréstimos aumenta automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation back */}
      <div className="flex justify-start pt-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs font-mono text-[#666] hover:text-[#e0e0e0] transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          VOLTAR AO PAINEL GERAL
        </button>
      </div>
    </div>
  )
}
