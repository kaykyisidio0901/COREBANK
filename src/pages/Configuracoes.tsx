import { useState } from "react"
import { useApp } from "../context/AppContext"

export function Configuracoes() {
  const { isCamouflaged, camuflagemSkin, setCamuflagemSkin, toggleCamouflage, ativarPanic, tenantId } = useApp()
  const [showPanicModal, setShowPanicModal] = useState(false)
  const [panicSenha, setPanicSenha] = useState("")
  const [panicErro, setPanicErro] = useState(false)

  const [taxaJuros, setTaxaJuros] = useState(() => localStorage.getItem(`corebank_config_${tenantId}_taxa`) || "3.5")
  const [multaAtraso, setMultaAtraso] = useState(() => localStorage.getItem(`corebank_config_${tenantId}_multa`) || "5.00")
  const [carencia, setCarencia] = useState(() => localStorage.getItem(`corebank_config_${tenantId}_carencia`) || "1")
  const [configSaved, setConfigSaved] = useState(false)

  const handleSalvarConfig = () => {
    localStorage.setItem(`corebank_config_${tenantId}_taxa`, taxaJuros)
    localStorage.setItem(`corebank_config_${tenantId}_multa`, multaAtraso)
    localStorage.setItem(`corebank_config_${tenantId}_carencia`, carencia)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CONFIG] Parâmetros da banca atualizados: taxa ${taxaJuros}%, multa R$ ${multaAtraso}, carência ${carencia}d` }))
  }

  const handleToggle = () => toggleCamouflage()

  const handlePanicConfirm = () => {
    if (panicSenha === "ADMIN") {
      setShowPanicModal(false)
      ativarPanic()
    } else {
      setPanicErro(true)
      setPanicSenha("")
      setTimeout(() => setPanicErro(false), 2000)
    }
  }

  const handlePanicCancel = () => {
    setShowPanicModal(false)
    setPanicSenha("")
    setPanicErro(false)
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
          <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Configurações de Segurança</h2>
          <span className="text-[10px] text-[#666] font-mono">SESSÃO ATIVA</span>
        </div>

        {/* Seção 1: Parâmetros da Banca */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm text-[#e0e0e0] font-mono font-[600]">Parâmetros da Banca</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase tracking-wider block mb-2">
                Taxa de Juros Padrão (% ao mês)
              </label>
              <input
                type="text"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase tracking-wider block mb-2">
                Multa por Atraso Diário (R$)
              </label>
              <input
                type="text"
                value={multaAtraso}
                onChange={(e) => setMultaAtraso(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666] font-mono uppercase tracking-wider block mb-2">
                Carência antes do alerta (dias)
              </label>
              <input
                type="text"
                value={carencia}
                onChange={(e) => setCarencia(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSalvarConfig}
              className="px-4 py-2 text-xs font-mono font-[600] text-[#00e55b] bg-[#00e55b]/10 border border-[#00e55b]/30 rounded-lg hover:bg-[#00e55b]/20 transition-colors"
            >
              {configSaved ? "Salvo!" : "Salvar Parâmetros"}
            </button>
            {configSaved && <span className="text-[10px] text-[#00e55b] font-mono">✓ Configurações salvas</span>}
          </div>
        </div>

        {/* Seção 2: Disfarce e Privacidade */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm text-[#e0e0e0] font-mono font-[600]">Disfarce e Privacidade</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#e0e0e0] font-mono">Ativar Modo Camuflagem</p>
              <p className="text-[10px] text-[#666] font-mono">Atalho: Ctrl + Shift + X</p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isCamouflaged ? "bg-[#00e55b]" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isCamouflaged ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-[10px] text-[#666] font-mono uppercase tracking-wider block mb-2">
              Tela de Disfarce
            </label>
            <select
              value={camuflagemSkin}
              onChange={(e) => setCamuflagemSkin(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
            >
              <option>Planilha de Excel Corporativa</option>
              <option>Portal de Notícias Financeiras</option>
              <option>Tela de Erro 404 do Servidor</option>
            </select>
          </div>
        </div>

        {/* Seção 3: Protocolo de Emergência */}
        <div className="bg-zinc-950/60 border-2 border-dashed border-red-900/60 rounded-xl p-5 space-y-4">
          <h3 className="text-sm text-[#FF3838] font-mono font-[600]">Protocolo de Emergência</h3>

          <button
            onClick={() => setShowPanicModal(true)}
            className="w-full py-4 bg-red-950/10 border-2 border-dashed border-red-900/60 rounded-xl text-[#FF3838] text-sm font-mono font-[700] hover:bg-[#FF3838]/20 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">warning</span>
            ⚠️ ACIONAR BOTÃO DE PÂNICO
          </button>

          <p className="text-[10px] text-[#FF3838]/60 font-mono leading-relaxed">
            Atenção: Ao clicar e confirmar com a senha mestre, todos os dados de clientes, contratos e
            histórico armazenados na nuvem serão imediatamente criptografados e apagados do banco de dados
            sem possibilidade de recuperação.
          </p>
        </div>
      </div>

      {/* Modal de Pânico */}
      {showPanicModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={handlePanicCancel} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-zinc-950 border-2 border-dashed border-[#FF3838]/50 rounded-xl p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-[#FF3838] text-2xl">warning</span>
                <div>
                  <h3 className="text-sm text-[#FF3838] font-mono font-[600]">Protocolo de Emergência</h3>
                  <p className="text-[10px] text-[#FF3838]/60 font-mono">Esta ação é irreversível</p>
                </div>
              </div>

              <p className="text-xs text-[#e0e0e0] font-mono mb-4 leading-relaxed">
                Todos os dados de clientes, contratos, transações e histórico armazenados serão
                permanentemente criptografados e removidos do banco de dados. A sessão será encerrada
                imediatamente.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#FF3838] font-mono block mb-1.5">
                    Digite a chave master para confirmar a destruição dos dados da nuvem
                  </label>
                  <input
                    type="password"
                    value={panicSenha}
                    onChange={(e) => setPanicSenha(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePanicConfirm()}
                    placeholder="********"
                    className="w-full bg-black/60 border border-[#FF3838]/30 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#FF3838]/70 transition-colors"
                  />
                </div>

                {panicErro && (
                  <p className="text-[10px] text-[#FF3838] font-mono">Senha master incorreta. Tente novamente.</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={handlePanicCancel} className="px-4 py-2 text-xs font-mono text-[#666] hover:text-[#e0e0e0] transition-colors">
                    CANCELAR
                  </button>
                  <button
                    onClick={handlePanicConfirm}
                    disabled={!panicSenha}
                    className="px-4 py-2 text-xs font-mono font-[600] text-[#FF3838] border border-[#FF3838]/50 rounded-lg hover:bg-[#FF3838]/10 transition-colors disabled:opacity-30"
                  >
                    CONFIRMAR DESTRUIÇÃO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
