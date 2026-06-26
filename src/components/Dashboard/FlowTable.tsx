import type { FlowItem } from "../../types"

function ActionButton({ item }: { item: FlowItem }) {
  const isLate = item.status === "late"
  const handleClick = () => {
    const action = isLate ? "COBRAR" : "NOTIFICAR"
    window.dispatchEvent(new CustomEvent("corebank:log", {
      detail: `[${action}] Ação disparada para ${item.client} — valor R$ ${item.value.toFixed(2)} — vencimento ${item.dueDate}`
    }))
  }
  if (isLate) {
    return (
      <button
        onClick={handleClick}
        className="w-full md:w-auto px-3 py-1 text-xs font-mono font-[600] text-[#ffb4ab] border border-[#ffb4ab]/30 hover:bg-[#ffb4ab]/10 transition-colors active:scale-[0.97] rounded"
      >
        COBRAR
      </button>
    )
  }
  return (
    <button
      onClick={handleClick}
      className="w-full md:w-auto px-3 py-1 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/30 hover:bg-[#00e55b]/10 transition-colors active:scale-[0.97] rounded"
    >
      NOTIFICAR
    </button>
  )
}

function TableRow({ item }: { item: FlowItem }) {
  const isLate = item.status === "late"
  return (
    <tr className={`transition-colors group ${isLate ? "hover:bg-[#ffb4ab]/5" : "hover:bg-[#00e55b]/5"}`}>
      <td className="py-4 px-4">
        <div className="flex flex-col">
          <span className="text-[#e0e0e0] text-sm">{item.client}</span>
          <span className="text-[10px] text-[#666]/50 font-mono">ID: 0x{item.id.toString(16).padStart(2, "0")}...FA1</span>
        </div>
      </td>
      <td className={`py-4 px-4 font-bold text-sm ${isLate ? "text-[#ffb4ab]" : "text-[#00e55b]"}`}>
        R$ {item.value.toFixed(2)}
      </td>
      <td className={`py-4 px-4 text-sm ${isLate ? "text-[#ffb4ab]" : "text-[#e0e0e0]"}`}>
        {isLate ? `Atrasado ${item.lateDays}d` : "Hoje"}
        {isLate && item.lateFee && (
          <span className="text-[10px] text-[#ffb4ab]/70 block">+R$ {item.lateFee}/dia</span>
        )}
      </td>
      <td className="py-4 px-4">
        {isLate ? (
          <span className="px-2 py-0.5 border border-[#ffb4ab]/30 text-[10px] text-[#ffb4ab] font-mono rounded">ATRASADO</span>
        ) : (
          <span className="px-2 py-0.5 border border-zinc-700 text-[10px] text-[#666] font-mono rounded">PENDENTE</span>
        )}
      </td>
      <td className="py-4 px-4">
        <ActionButton item={item} />
      </td>
    </tr>
  )
}

function MobileCard({ item }: { item: FlowItem }) {
  const isLate = item.status === "late"
  return (
    <div className={`p-4 rounded-lg ${isLate ? "bg-[#ffb4ab]/5 border border-[#ffb4ab]/20" : "bg-zinc-900 border border-zinc-800"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-[#e0e0e0] font-mono">{item.client}</p>
          <p className="text-[10px] text-[#666]/50 font-mono">ID: 0x{item.id.toString(16).padStart(2, "0")}...FA1</p>
        </div>
        <span className={`text-base font-bold font-mono ${isLate ? "text-[#ffb4ab]" : "text-[#00e55b]"}`}>
          R$ {item.value.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-mono ${isLate ? "text-[#ffb4ab]" : "text-[#e0e0e0]"}`}>
          {isLate ? `Atrasado ${item.lateDays}d` : "Vence hoje"}
        </span>
        {isLate ? (
          <span className="px-2 py-0.5 border border-[#ffb4ab]/30 text-[10px] text-[#ffb4ab] font-mono rounded">ATRASADO</span>
        ) : (
          <span className="px-2 py-0.5 border border-zinc-700 text-[10px] text-[#666] font-mono rounded">PENDENTE</span>
        )}
      </div>
      <ActionButton item={item} />
    </div>
  )
}

export function FlowTable({ items }: { items: FlowItem[] }) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left font-mono text-sm border-collapse">
          <thead className="text-[#666] border-b border-zinc-800/50">
            <tr>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Devedor</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Valor</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Vencimento</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {items.map((item) => (
              <TableRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <MobileCard key={item.id} item={item} />
        ))}
      </div>
    </>
  )
}
