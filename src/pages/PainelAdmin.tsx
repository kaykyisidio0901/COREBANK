import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import type { TenantAdmin } from "../types"

export default function PainelAdmin() {
  const { tenantsCadastrados, adicionarTenant, toggleTenantStatus, user, tenantId } = useApp()

  if (user !== "admin" || tenantId !== "corebank") {
    return <Navigate to="/" replace />
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [tid, setTid] = useState("")
  const [operator, setOperator] = useState("")

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!tid.trim() || !operator.trim()) return
    adicionarTenant(tid.trim(), operator.trim())
    setTid("")
    setOperator("")
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl text-[#e0e0e0] font-mono font-[700] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00e55b] text-2xl">admin_panel_settings</span>
            Painel de Acesso — Clientes
          </h1>
          <p className="text-[#666] text-xs font-mono mt-1">
            Gerencie os acessos dos clientes que adquiriram o sistema CORE-BANK.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 h-10 bg-black border border-[#00e55b] text-[#00e55b] font-mono text-sm rounded-xl hover:bg-[#00e55b]/10 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Novo Cliente
        </button>
      </div>

      {/* Tabela */}
      {tenantsCadastrados.length === 0 ? (
        <div className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-[#333] text-5xl mb-4">groups</span>
          <p className="text-[#666] font-mono text-sm">Nenhum cliente cadastrado ainda.</p>
          <p className="text-[#444] font-mono text-xs mt-1">Crie o primeiro acesso para liberar o sistema.</p>
        </div>
      ) : (
        <div className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[#666] text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 font-[500]">Tenant ID</th>
                <th className="px-4 py-3 font-[500]">Operador</th>
                <th className="px-4 py-3 font-[500]">Chave de Acesso</th>
                <th className="px-4 py-3 font-[500]">Status</th>
                <th className="px-4 py-3 font-[500]">Criado em</th>
                <th className="px-4 py-3 font-[500]">Último acesso</th>
                <th className="px-4 py-3 font-[500]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenantsCadastrados.map((t: TenantAdmin) => (
                <tr key={t.tenantId} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 text-[#e0e0e0]">{t.tenantId}</td>
                  <td className="px-4 py-3 text-[#e0e0e0]">{t.operator}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-600 text-xs font-mono italic">Definida pelo cliente</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
                        t.status === "ativo"
                          ? "text-[#00e55b] border-[#00e55b]/30 bg-[#00e55b]/5"
                          : "text-[#FF3838] border-[#FF3838]/30 bg-[#FF3838]/5"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === "ativo" ? "bg-[#00e55b]" : "bg-[#FF3838]"}`} />
                      {t.status === "ativo" ? "ATIVO" : "INATIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#666]">{t.dataCriacao}</td>
                  <td className="px-4 py-3 text-[#666]">{t.ultimoAcesso}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleTenantStatus(t.tenantId)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                        t.status === "ativo"
                          ? "text-[#FF3838] border-[#FF3838]/30 hover:bg-[#FF3838]/10"
                          : "text-[#00e55b] border-[#00e55b]/30 hover:bg-[#00e55b]/10"
                      }`}
                    >
                      {t.status === "ativo" ? "Bloquear" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-6 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[#e0e0e0] font-mono font-[700] text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00e55b]">vpn_key</span>
              Novo Acesso
            </h2>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[#666] text-xs font-mono tracking-wider uppercase">ID da Empresa / Tenant Key</label>
                <input
                  type="text"
                  placeholder="Ex: banca-itaim"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 outline-none focus:border-[#00e55b] focus:ring-1 focus:ring-[#00e55b] transition-all font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[#666] text-xs font-mono tracking-wider uppercase">Operador Padrão</label>
                <input
                  type="text"
                  placeholder="Ex: operador_01"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 outline-none focus:border-[#00e55b] focus:ring-1 focus:ring-[#00e55b] transition-all font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-11 border border-zinc-800 text-[#666] font-mono text-sm rounded-xl hover:bg-zinc-900 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-black border border-[#00e55b] text-[#00e55b] font-mono text-sm rounded-xl hover:bg-[#00e55b]/10 transition-all"
                >
                  Criar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
