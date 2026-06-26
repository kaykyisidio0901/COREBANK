import { useState, useEffect } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { MatrixBg } from "./MatrixBg"
import { SystemLogs } from "./SystemLogs"
import { useApp } from "../context/AppContext"

function DisguiseExcel() {
  const linhas = Array.from({ length: 15 }, (_, i) => i)
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-sans text-gray-800 font-bold">Relatório de Desempenho Financeiro — Q2 2026</h1>
            <p className="text-xs text-gray-500 font-sans">CoreBank S/A — Departamento de Controladoria</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-sans">Documento Interno</p>
            <p className="text-xs text-gray-500 font-sans">Confidencial</p>
          </div>
        </div>
        <table className="w-full border-collapse border border-gray-300 text-xs font-sans">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-bold">Cliente</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Contrato</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Valor (R$)</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Vencimento</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-1.5 text-gray-600">Cliente Exemplo {i + 1}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">CTR-{(1000 + i).toString(16).toUpperCase()}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">{(Math.random() * 10000).toFixed(2)}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">{`${String(Math.floor(Math.random() * 28 + 1)).padStart(2, "0")}/07/2026`}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${i % 3 === 0 ? "bg-green-100 text-green-700" : i % 3 === 1 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {i % 3 === 0 ? "Pago" : i % 3 === 1 ? "Pendente" : "Atrasado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-[10px] text-gray-400 font-sans text-center">
          CoreBank S/A — Planilha Corporativa — Todos os direitos reservados
        </div>
      </div>
    </div>
  )
}

function DisguiseNews() {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-serif text-gray-900 font-bold">Financial Times • Brasil</h1>
          <p className="text-xs text-gray-500 font-sans">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="space-y-6">
          {[
            { titulo: "Mercado financeiro opera em alta com expectativa de corte de juros", resumo: "Ibovespa sobe 1,2% impulsionado por dados de inflação abaixo do esperado. Investidores aguardam decisão do Copom na próxima semana." },
            { titulo: "Dólar recua e fecha a R$ 5,02 com fluxo de capital estrangeiro", resumo: "Moeda norte-americana opera em queda pelo terceiro dia consecutivo, acompanhando o cenário externo favorável e a entrada de recursos." },
            { titulo: "Setor de tecnologia puxa recuperação da bolsa brasileira", resumo: "Ações de empresas de tecnologia sobem mais de 3% na sessão de hoje, liderando os ganhos do mercado acionário doméstico." },
          ].map((n, i) => (
            <div key={i}>
              <h2 className="text-lg font-serif text-gray-900 font-bold mb-1">{n.titulo}</h2>
              <p className="text-sm font-serif text-gray-600 leading-relaxed">{n.resumo}</p>
              <div className="border-t border-gray-100 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Disguise404() {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-mono text-gray-300 font-bold mb-4">404</h1>
        <h2 className="text-xl font-sans text-gray-500 mb-2">Página não encontrada</h2>
        <p className="text-sm font-sans text-gray-400 mb-6">O servidor não pôde encontrar o recurso solicitado.</p>
        <div className="inline-block bg-gray-200 rounded px-4 py-2 text-xs font-mono text-gray-500">
          GET /corebank/dashboard — HTTP/1.1 404 Not Found
        </div>
      </div>
    </div>
  )
}

function PanicScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl font-mono text-[#FF3838] font-bold" style={{ filter: "drop-shadow(0 0 20px rgba(255,56,56,0.6))" }}>
          ⚠
        </div>
        <h1 className="text-2xl font-mono text-[#FF3838] font-bold tracking-widest" style={{ filter: "drop-shadow(0 0 12px rgba(255,56,56,0.5))" }}>
          SESSÃO ENCERRADA
        </h1>
        <p className="text-sm font-mono text-[#FF3838]/70">
          DADOS CRIPTOGRAFADOS COM SUCESSO.
        </p>
        <p className="text-[10px] font-mono text-[#666] mt-8">
          Protocolo de Emergência — CoreBank
        </p>
      </div>
    </div>
  )
}

const links = [
  { to: "/", label: "Painel Geral", icon: "dashboard" },
  { to: "/clientes", label: "Carteira de Clientes", icon: "group" },
  { to: "/agenda", label: "Agenda de Recebimento", icon: "calendar_today" },
  { to: "/fluxo", label: "Auditoria de Caixa", icon: "account_balance_wallet" },
  { to: "/capital", label: "Gestão de Capital", icon: "account_balance" },
  { to: "/config", label: "Configurações de Segurança", icon: "security" },
  { to: "/admin", label: "Painel Admin", icon: "admin_panel_settings" },
]

export function Layout() {
  const [isOpen, setIsOpen] = useState(false)
  const { saldoBaixo, isCamouflaged, camuflagemSkin, toggleCamouflage, panicMode, tenantId, user, saldoDisponivel, logout } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault()
        toggleCamouflage()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggleCamouflage])

  function handleLogout() {
    logout()
    navigate("/", { replace: true })
  }

  const isAdmin = user === "admin" && tenantId === "corebank"
  const visibleLinks = isAdmin ? links : links.filter((l) => l.to !== "/admin")

  return (
    <div className="flex flex-col w-full min-h-screen bg-black text-white overflow-x-hidden">
      {panicMode && <PanicScreen />}

      {!panicMode && isCamouflaged && (
        <>
          {camuflagemSkin === "Planilha de Excel Corporativa" && <DisguiseExcel />}
          {camuflagemSkin === "Portal de Notícias Financeiras" && <DisguiseNews />}
          {camuflagemSkin === "Tela de Erro 404 do Servidor" && <Disguise404 />}
        </>
      )}

      {!panicMode && !isCamouflaged && (
        <>
          {saldoBaixo && (
            <div className="w-full bg-[#FF3838]/10 border-b border-[#FF3838]/30 px-4 md:px-6 py-2 animate-pulse z-20 relative">
              <p className="text-xs text-[#FF3838] font-mono font-[600] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                OPERAÇÃO EM RISCO: Saldo abaixo do limite de segurança. Injete mais capital imediatamente.
              </p>
            </div>
          )}

          {/* Mobile top bar */}
          <div className="md:hidden w-full h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 sticky top-0 z-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(true)} className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] text-xl">
                menu
              </button>
              <span className="material-symbols-outlined text-[#00e55b] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
              <span className="text-[#e0e0e0] font-mono font-[700] text-sm truncate">{tenantId}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-[#666] font-mono text-right leading-tight">
                DISPONÍVEL<br />
                <span className={`text-xs font-[700] ${saldoBaixo ? "text-[#FF3838]" : "text-[#00e55b]"}`}>R$ {saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>

          {/* Content area: sidebar + main */}
          <div className="flex flex-1 min-h-0 flex-col md:flex-row">
            <MatrixBg />

            {/* Backdrop for mobile */}
            {isOpen && (
              <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
            )}

            {/* Sidebar — mobile overlay / desktop static left */}
            <aside
              className={`
                fixed inset-y-0 left-0 z-50 flex flex-col justify-between
                w-64 min-w-[260px] bg-zinc-950 border-r border-zinc-900 p-5
                transform transition-transform duration-300 ease-out
                md:sticky md:translate-x-0 md:flex md:h-screen
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
              `}
            >
              <div>
                {/* Mobile close button */}
                <div className="flex items-center justify-between mb-6 md:hidden">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#00e55b] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      shield
                    </span>
                    <h1 className="font-[700] text-[#e0e0e0] text-lg tracking-tight font-mono">CORE-BANK</h1>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] transition-colors">
                    close
                  </button>
                </div>

                {/* Desktop header */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#00e55b] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      shield
                    </span>
                    <h1 className="font-[700] text-[#e0e0e0] text-lg tracking-tight font-mono">CORE-BANK</h1>
                  </div>
                </div>

                <p className="text-[#00e55b] text-xs font-mono mb-1">{user.toUpperCase()}</p>
                <p className="text-[#666] text-[10px] font-mono mb-6">TENANT: {tenantId}</p>

                <nav className="space-y-[2px]">
                  {visibleLinks.map(({ to, label, icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 font-mono text-sm rounded-md transition-all whitespace-nowrap ${
                          isActive
                            ? "text-[#00e55b] bg-[#00e55b]/10"
                            : "text-[#666] hover:text-[#e0e0e0] hover:bg-zinc-800"
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-lg flex-shrink-0">{icon}</span>
                      <span className="truncate">{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="pt-6 border-t border-zinc-900">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 font-mono text-sm rounded-md transition-all text-[#FF3838] hover:bg-[#FF3838]/10 mb-4"
                >
                  <span className="material-symbols-outlined text-lg flex-shrink-0">logout</span>
                  <span className="truncate">Encerrar Sessão</span>
                </button>
                <div className="flex items-center gap-2 text-[#00e55b] text-xs font-mono vpn-pulse">
                  <span className="material-symbols-outlined text-sm">vpn_lock</span>
                  VPN: ACTIVE
                </div>
                <div className="mt-3 text-[10px] text-[#666] font-mono leading-relaxed">
                  SYS_VER: 4.2.0-STABLE<br />
                  LATENCY: 14ms
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 w-full p-4 md:p-6 space-y-6 overflow-y-auto">
              <Outlet />
            </main>
          </div>

          <SystemLogs />
        </>
      )}
    </div>
  )
}
