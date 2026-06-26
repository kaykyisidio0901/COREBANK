import { useState } from "react"
import { useApp } from "../context/AppContext"

function formatValor(v: number) {
  return v.toFixed(2).replace(".", ",")
}

function handleValorChange(raw: string, setter: (v: string) => void) {
  const digits = raw.replace(/[^\d]/g, "")
  if (digits === "") { setter(""); return }
  const num = parseInt(digits, 10) / 100
  setter(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}

const operacaoColors: Record<string, string> = {
  APORTE: "text-[#00e55b]",
  PAGAMENTO: "text-[#00e55b]",
  ENTRADA: "text-[#00e55b]",
  SAÍDA: "text-[#FF3838]",
  SANGRIA: "text-[#FF3838]",
  EMPRÉSTIMO: "text-[#FF3838]",
  "MULTA AUTO": "text-[#FFD700]",
}

export function Caixa() {
  const { saldoDisponivel, transacoes, injetarCapital, retirarCapital, registrarPagamento } = useApp()

  const [showInjetar, setShowInjetar] = useState(false)
  const [showSangria, setShowSangria] = useState(false)
  const [showPagamento, setShowPagamento] = useState(false)

  const [aporteValor, setAporteValor] = useState("")
  const [aporteOrigem, setAporteOrigem] = useState("")

  const [sangriaValor, setSangriaValor] = useState("")
  const [sangriaMotivo, setSangriaMotivo] = useState("")

  const [pagtoNome, setPagtoNome] = useState("")
  const [pagtoValor, setPagtoValor] = useState("")

  const entradas = transacoes
    .filter((t) => t.tipo === "APORTE" || t.tipo === "PAGAMENTO" || t.tipo === "ENTRADA")
    .reduce((s, t) => s + t.valor, 0)

  const saidas = transacoes
    .filter((t) => t.tipo === "EMPRÉSTIMO" || t.tipo === "SANGRIA" || t.tipo === "SAÍDA")
    .reduce((s, t) => s + t.valor, 0)

  const lucro = entradas - saidas

  const handleAporte = () => {
    const v = parseFloat(aporteValor.replace(/\./g, "").replace(",", ".")) || 0
    if (v <= 0) return
    injetarCapital(v, aporteOrigem)
    setShowInjetar(false)
    setAporteValor("")
    setAporteOrigem("")
  }

  const handleSangria = () => {
    const v = parseFloat(sangriaValor.replace(/\./g, "").replace(",", ".")) || 0
    if (v <= 0) return
    retirarCapital(v, sangriaMotivo)
    setShowSangria(false)
    setSangriaValor("")
    setSangriaMotivo("")
  }

  const handlePagamento = () => {
    const v = parseFloat(pagtoValor.replace(/\./g, "").replace(",", ".")) || 0
    if (v <= 0 || !pagtoNome.trim()) return
    registrarPagamento(pagtoNome.trim(), v, `#${gerarHashCurto()}`)
    setShowPagamento(false)
    setPagtoNome("")
    setPagtoValor("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Auditoria de Caixa / Extrato</h2>
        <span className="text-[10px] text-[#666] font-mono">SESSÃO ATIVA</span>
      </div>

      {/* Tríplice de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Saldo Disponível</p>
          <p className="text-2xl font-mono font-[700] text-[#00e55b]" style={{ filter: "drop-shadow(0 0 8px rgba(0,255,102,0.4))" }}>
            R$ {formatValor(saldoDisponivel)}
          </p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Total Entradas</p>
          <p className="text-2xl font-mono font-[700] text-[#00e55b]">R$ {formatValor(entradas)}</p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Lucro Líquido (Entradas - Saídas)</p>
          <p className={`text-2xl font-mono font-[700] ${lucro >= 0 ? "text-[#00e55b]" : "text-[#FF3838]"}`}
            style={lucro >= 0 ? { filter: "drop-shadow(0 0 8px rgba(0,255,102,0.4))" } : { filter: "drop-shadow(0 0 8px rgba(255,56,56,0.4))" }}>
            R$ {formatValor(lucro)}
          </p>
        </div>
      </div>

      {/* Mini cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Saídas / Empréstimos (Mês)</p>
          <p className="text-2xl font-mono font-[700] text-[#e0e0e0]">R$ {formatValor(saidas)}</p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Total de Transações</p>
          <p className="text-2xl font-mono font-[700] text-[#e0e0e0]">{transacoes.length}</p>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowInjetar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00e55b]/10 border border-[#00e55b]/30 rounded-lg text-[#00e55b] text-sm font-mono hover:bg-[#00e55b]/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Injetar Capital
        </button>
        <button
          onClick={() => setShowPagamento(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00e55b]/10 border border-[#00e55b]/30 rounded-lg text-[#00e55b] text-sm font-mono hover:bg-[#00e55b]/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">payments</span>
          Registrar Pagamento
        </button>
        <button
          onClick={() => setShowSangria(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[#e0e0e0] text-sm font-mono hover:bg-zinc-800 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">remove_circle</span>
          Realizar Sangria de Lucro
        </button>
      </div>

      {/* Modal Injetar Capital */}
      {showInjetar && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowInjetar(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm text-[#e0e0e0] font-mono font-[600] mb-4">Injetar Capital</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Valor do Aporte</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                    <input type="text" inputMode="numeric" value={aporteValor} onChange={(e) => handleValorChange(e.target.value, setAporteValor)} placeholder="0,00" className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Origem do Recurso</label>
                  <input type="text" value={aporteOrigem} onChange={(e) => setAporteOrigem(e.target.value)} placeholder="Ex: Caixa Físico / Transferência" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowInjetar(false)} className="px-4 py-2 text-xs font-mono text-[#666] hover:text-[#e0e0e0] transition-colors">CANCELAR</button>
                  <button onClick={handleAporte} disabled={!aporteValor} className="px-4 py-2 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30">CONFIRMAR APORTE</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Registrar Pagamento */}
      {showPagamento && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowPagamento(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm text-[#e0e0e0] font-mono font-[600] mb-4">Registrar Pagamento</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Nome do Cliente</label>
                  <input type="text" value={pagtoNome} onChange={(e) => setPagtoNome(e.target.value)} placeholder="Ex: Marcos Borracharia" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Valor Recebido</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                    <input type="text" inputMode="numeric" value={pagtoValor} onChange={(e) => handleValorChange(e.target.value, setPagtoValor)} placeholder="0,00" className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowPagamento(false)} className="px-4 py-2 text-xs font-mono text-[#666] hover:text-[#e0e0e0] transition-colors">CANCELAR</button>
                  <button onClick={handlePagamento} disabled={!pagtoValor || !pagtoNome.trim()} className="px-4 py-2 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30">CONFIRMAR PAGAMENTO</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Sangria */}
      {showSangria && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowSangria(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm text-[#e0e0e0] font-mono font-[600] mb-4">Realizar Sangria de Lucro</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Valor da Retirada</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                    <input type="text" inputMode="numeric" value={sangriaValor} onChange={(e) => handleValorChange(e.target.value, setSangriaValor)} placeholder="0,00" className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#FF3838]/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Motivo</label>
                  <input type="text" value={sangriaMotivo} onChange={(e) => setSangriaMotivo(e.target.value)} placeholder="Ex: Retirada de lucro do mês" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#FF3838]/50 transition-colors" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowSangria(false)} className="px-4 py-2 text-xs font-mono text-[#666] hover:text-[#e0e0e0] transition-colors">CANCELAR</button>
                  <button onClick={handleSangria} disabled={!sangriaValor} className="px-4 py-2 text-xs font-mono font-[600] text-[#FF3838] border border-[#FF3838]/50 rounded-lg hover:bg-[#FF3838]/10 transition-colors disabled:opacity-30">CONFIRMAR SANGRIA</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tabela de extrato */}
      <div className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-left font-mono text-sm border-collapse min-w-[600px]">
          <thead className="text-[#666] border-b border-zinc-800/50">
            <tr>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Timestamp</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Operação</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Descrição</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Hash-ID</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {transacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#666] text-xs font-mono">Nenhuma transação registrada. Use os botões acima para movimentar o caixa.</td>
              </tr>
            ) : (
              transacoes.map((t, i) => {
                const isSaida = t.tipo === "EMPRÉSTIMO" || t.tipo === "SANGRIA" || t.tipo === "SAÍDA"
                return (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-4 text-[#666] text-xs font-mono">{t.timestamp}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-[600] ${operacaoColors[t.tipo] || "text-[#e0e0e0]"}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#e0e0e0] text-xs font-mono">{t.descricao}</td>
                    <td className="py-4 px-4 text-[#666] text-xs font-mono">{t.hash}</td>
                    <td className={`py-4 px-4 font-[700] text-sm ${isSaida ? "text-[#FF3838]" : "text-[#00e55b]"}`}>
                      {isSaida ? "-" : "+"} R$ {formatValor(t.valor)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function gerarHashCurto() {
  const hex = "0123456789abcdef"
  let h = "#"
  for (let i = 0; i < 4; i++) h += hex[Math.floor(Math.random() * 16)]
  h += "..."
  for (let i = 0; i < 4; i++) h += hex[Math.floor(Math.random() * 16)]
  return h
}
