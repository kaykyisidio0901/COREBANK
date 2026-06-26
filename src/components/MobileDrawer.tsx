import { NavLink } from "react-router-dom"

const links = [
  { to: "/", label: "Painel Geral", icon: "dashboard" },
  { to: "/clientes", label: "Carteira de Clientes", icon: "group" },
  { to: "/agenda", label: "Agenda de Recebimento", icon: "calendar_today" },
  { to: "/fluxo", label: "Auditoria de Caixa", icon: "account_balance_wallet" },
  { to: "/config", label: "Configurações de Segurança", icon: "security" },
]

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950/95 border-r border-zinc-800 transform transition-transform duration-200 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00e55b] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield
            </span>
            <h1 className="font-[700] text-[#e0e0e0] text-lg tracking-tight font-mono">CORE-BANK</h1>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] transition-colors">
            close
          </button>
        </div>
        <nav className="py-4 px-3 space-y-[2px]">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 font-mono text-sm rounded-md transition-all duration-75 ${
                  isActive
                    ? "text-[#00e55b] bg-[#00e55b]/10"
                    : "text-[#666] hover:text-[#e0e0e0] hover:bg-zinc-800"
                }`
              }
            >
              <span className="material-symbols-outlined mr-3 flex-shrink-0 text-lg">{icon}</span>
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 right-0 px-6 pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-2 vpn-pulse text-[#00e55b] text-xs font-mono">
            <span className="material-symbols-outlined text-sm">vpn_lock</span>
            VPN: ACTIVE
          </div>
        </div>
      </aside>
    </>
  )
}
