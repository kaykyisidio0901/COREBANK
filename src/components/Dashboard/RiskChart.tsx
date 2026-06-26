import { PieChart, Pie, Cell } from "recharts"
import type { CategoryRisk } from "../../types"

export function RiskChart({ data }: { data: CategoryRisk[] }) {
  const total = data.reduce((s, d) => s + d.contracts, 0)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 rounded-full flex items-center justify-center flex-shrink-0">
        <PieChart width={176} height={176}>
          <Pie data={data} dataKey="contracts" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} stroke="none" paddingAngle={2} startAngle={90} endAngle={-270}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute text-center pointer-events-none">
          <span className="text-[10px] text-[#666] font-mono">TOTAL</span>
          <p className="text-2xl font-mono font-[700] text-[#e0e0e0]">{total}</p>
          <span className="text-[10px] text-[#666] font-mono">CONTRATOS</span>
        </div>
      </div>

      <div className="mt-6 w-full space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[#e0e0e0]">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#666] text-[10px]">{item.contracts}</span>
              <span className="text-[#666]">{item.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
