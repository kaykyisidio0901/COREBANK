import type { CategoryRisk } from "../../types"

export function RiskChart({ data }: { data: CategoryRisk[] }) {
  const total = data.reduce((s, d) => s + d.contracts, 0)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 border-[10px] border-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
        <div
          className="absolute inset-0 border-[10px] border-[#00e55b] rounded-full"
          style={{
            clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%, 50% 50%)",
            transform: "rotate(45deg)",
          }}
        />
        <div
          className="absolute inset-0 border-[10px] border-[#ffb4ab] rounded-full"
          style={{
            clipPath: "polygon(50% 50%, 50% 0%, 100% 0%)",
            transform: "rotate(-20deg)",
          }}
        />
        <div className="text-center">
          <span className="text-[10px] text-[#666] font-mono">TOTAL</span>
          <p className="text-2xl font-mono font-[700] text-[#e0e0e0]">{total}</p>
          <span className="text-[10px] text-[#666] font-mono">CONTRATOS</span>
        </div>
      </div>

      <div className="mt-6 w-full space-y-3">
        {data.map((item, i) => {
          const colors = ["#00e55b", "#00c44e", "#ffb4ab"]
          return (
            <div key={i} className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors[i] }} />
                <span className="text-[#e0e0e0]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#666] text-[10px]">{item.contracts}</span>
                <span className="text-[#666]">{item.value}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
