import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"

const links = [
  { to: "/", label: "Painel Geral", icon: "dashboard" },
  { to: "/clientes", label: "Carteira de Clientes", icon: "group" },
  { to: "/agenda", label: "Agenda de Recebimento", icon: "calendar_today" },
  { to: "/fluxo", label: "Auditoria de Caixa", icon: "account_balance_wallet" },
  { to: "/capital", label: "Gestão de Capital", icon: "account_balance" },
  { to: "/config", label: "Configurações de Segurança", icon: "security" },
  { to: "/admin", label: "Painel Admin", icon: "admin_panel_settings" },
]

export function Sidebar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const { saldoDisponivel, saldoBaixo, tenantId, user, logout } = useApp()
  const navigate = useNavigate()

  const isAdmin = user === "admin" && tenantId === "corebank"
  const visibleLinks = isAdmin ? links : links.filter((l) => l.to !== "/admin")

  function handleLogout() {
    logout()
    navigate("/", { replace: true })
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden w-full h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] text-xl">
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

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-zinc-950 border-r border-zinc-900 p-4 sticky top-0 z-30 flex-shrink-0 transition-all duration-200 ${
          collapsed ? "w-16 min-w-[64px]" : "w-64 min-w-[260px]"
        }`}
      >
        {collapsed ? (
          /* Collapsed: only shield + three dots */
          <div className="flex flex-col items-center gap-6 pt-2">
            <span className="material-symbols-outlined text-[#00e55b] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <button
              onClick={() => setCollapsed(false)}
              className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] transition-colors text-xl"
              title="Expandir sidebar"
            >
              more_vert
            </button>
          </div>
        ) : (
          /* Expanded: full content */
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00e55b] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                <h1 className="font-[700] text-[#e0e0e0] text-lg tracking-tight font-mono">CORE-BANK</h1>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] transition-colors text-xl"
                title="Recolher sidebar"
              >
                more_vert
              </button>
            </div>

            <p className="text-[#00e55b] text-xs font-mono mb-1">{user.toUpperCase()}</p>
            <p className="text-[#666] text-[10px] font-mono mb-6">TENANT: {tenantId}</p>

            <nav className="flex-1 space-y-[2px]">
              {visibleLinks.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
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
          </>
        )}
      </aside>
    </>
  )
}
