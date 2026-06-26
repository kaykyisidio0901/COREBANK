import { TrendingUp, PlusCircle, FileText } from "lucide-react"

export function QuickActions({ onNewLoan }: { onNewLoan: () => void }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] text-[#52525b] font-medium tracking-wide uppercase mb-3">Ações Rápidas</p>
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#2a2a2e] transition-all">
          <PlusCircle size={14} />
          Injetar Capital
        </button>
        <button onClick={onNewLoan} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#2a2a2e] transition-all">
          <TrendingUp size={14} />
          Novo Empréstimo
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#1e1e22] text-[#52525b] hover:text-[#a1a1aa] hover:border-[#2a2a2e] transition-all">
          <FileText size={14} />
          Exportar
        </button>
      </div>
    </div>
  )
}
