import { useState } from "react"
import { CadastroCliente, type DadosCliente } from "../components/Dashboard/CadastroCliente"
import { useApp } from "../context/AppContext"

function badgeNivel(nivel: string, score: number) {
  if (nivel === "Elite")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#00e55b] border border-[#00e55b]/40 rounded" style={{ filter: "drop-shadow(0 0 4px rgba(0,229,91,0.3))" }}>
        <span className="w-1.5 h-1.5 bg-[#00e55b] rounded-full" />
        ELITE / CRÉDITO LIVRE
      </span>
    )
  if (nivel === "Médio")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#ffb4ab] border border-[#ffb4ab]/30 rounded">
        BOM PAGADOR
      </span>
    )
  if (score <= 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#FF3838] border border-[#FF3838]/30 rounded">
        <span className="w-1.5 h-1.5 bg-[#FF3838] rounded-full animate-pulse" />
        BLACKLIST
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#FF3838] border border-[#FF3838]/30 rounded">
      <span className="w-1.5 h-1.5 bg-[#FF3838] rounded-full animate-pulse" />
      ALTO RISCO / TRAVADO
    </span>
  )
}

export function Clientes() {
  const { clientes, adicionarCliente } = useApp()
  const [filtro, setFiltro] = useState("todos")
  const [perfilAberto, setPerfilAberto] = useState<number | null>(null)
  const [cadastroAberto, setCadastroAberto] = useState(false)

  const handleSalvarCadastro = (dados: DadosCliente) => {
    adicionarCliente(dados)
    setCadastroAberto(false)
  }

  const filtrados = clientes.filter((c) => {
    if (filtro === "todos") return true
    if (filtro === "score-elite") return c.nivel === "Elite"
    if (filtro === "blacklist") return c.status === "blacklist"
    return c.status === filtro
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Carteira de Clientes / CRM</h2>
          <p className="text-[10px] text-[#666] font-mono">SISTEMA DE SCORE & FIDELIDADE</p>
        </div>
        <span className="text-[10px] text-[#666] font-mono">SESSÃO ATIVA</span>
      </div>

      {/* Busca + Ação */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#666] text-base">search</span>
          <input
            type="text"
            placeholder="Buscar devedor pelo nome ou ID..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setCadastroAberto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00e55b]/10 border border-[#00e55b]/30 rounded-lg text-[#00e55b] text-sm font-mono hover:bg-[#00e55b]/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "todos", label: "Todos os Clientes" },
          { key: "em-dia", label: "Em Dia" },
          { key: "critico", label: "Atrasados" },
          { key: "score-elite", label: "Score Elite (+1000 pts)" },
          { key: "blacklist", label: "Blacklist" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
              filtro === key
                ? "border-[#00e55b] text-[#00e55b] bg-[#00e55b]/10"
                : "border-zinc-800 text-[#666] hover:text-[#e0e0e0] hover:border-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-left font-mono text-sm border-collapse min-w-[800px]">
          <thead className="text-[#666] border-b border-zinc-800/50">
            <tr>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">ID Cripto</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Nome do Devedor</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Total Alocado</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Saldo Devedor</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Score / Nível</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Último Pagamento</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="py-4 px-4 font-medium text-xs uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtrados.map((c, i) => (
              <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-4 px-4 text-[#666] text-xs">{c.id}</td>
                <td className="py-4 px-4 text-[#e0e0e0]">{c.nome}</td>
                <td className="py-4 px-4 text-[#00e55b]">R$ {c.alocado.toFixed(2)}</td>
                <td className="py-4 px-4 text-[#e0e0e0]">R$ {c.devedor.toFixed(2)}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-[700] ${c.nivel === "Elite" ? "text-[#00e55b]" : c.nivel === "Médio" ? "text-[#ffb4ab]" : "text-[#FF3838]"}`}>
                      {c.score.toLocaleString()} pts
                    </span>
                    {badgeNivel(c.nivel, c.score)}
                  </div>
                </td>
                <td className="py-4 px-4 text-[#666]">{c.ultimoPgto}</td>
                <td className="py-4 px-4">
                  {c.status === "critico" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#FF3838] border border-[#FF3838]/30 rounded">
                      <span className="w-1.5 h-1.5 bg-[#FF3838] rounded-full animate-pulse" />
                      CRÍTICO
                    </span>
                  ) : c.status === "blacklist" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-[600] text-[#FF3838] border border-[#FF3838]/50 rounded">
                      <span className="w-1.5 h-1.5 bg-[#FF3838] rounded-full animate-pulse" />
                      BLOQUEADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-[600] text-[#00e55b] border border-[#00e55b]/30 rounded">
                      EM DIA
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => setPerfilAberto(perfilAberto === i ? null : i)}
                    className="px-3 py-1 text-xs font-mono text-[#00e55b] border border-[#00e55b]/30 rounded hover:bg-[#00e55b]/10 transition-colors"
                  >
                    Ver Perfil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Painel de perfil */}
      {perfilAberto !== null && (
        <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Scan + Score card */}
          <div className="flex flex-col items-center justify-center border border-zinc-800 rounded-lg p-6 bg-black/40">
            <div className="w-24 h-24 rounded-full border-2 border-[#00e55b]/30 flex items-center justify-center mb-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#00e55b]/10 to-transparent" />
              <span className="material-symbols-outlined text-4xl text-[#00e55b]/40">person</span>
            </div>
            <p className="text-[#00e55b] text-xs font-mono">SCAN: OK</p>
            <p className="text-[#666] text-[10px] font-mono">Termal ID: {clientes[perfilAberto].id}</p>
            <div className="mt-4 pt-4 border-t border-zinc-800 w-full text-center">
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Score de Fidelidade</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${clientes[perfilAberto].nivel === "Elite" ? "text-[#00e55b]" : clientes[perfilAberto].nivel === "Médio" ? "text-[#ffb4ab]" : "text-[#FF3838]"}`}>
                {clientes[perfilAberto].score.toLocaleString()} pts
              </p>
              {clientes[perfilAberto].score < 200 && (
                <p className="text-[10px] text-[#FF3838] font-mono mt-1">❌ BLOQUEADO — Score abaixo de 200 pts</p>
              )}
            </div>
          </div>

          {/* Dados + Score History */}
          <div className="space-y-4">
            <h4 className="text-sm text-[#e0e0e0] font-mono font-[600]">Ficha Confidencial do Cliente</h4>
            <div>
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Nome</p>
              <p className="text-sm text-[#e0e0e0] font-mono">{clientes[perfilAberto].nome}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Endereço Residencial</p>
              <p className="text-sm text-[#e0e0e0] font-mono">{clientes[perfilAberto].endereco}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Endereço Comercial</p>
              <p className="text-sm text-[#e0e0e0] font-mono">{clientes[perfilAberto].enderecoComercial}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-2">Histórico de Score</p>
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                {clientes[perfilAberto].historicoScore.map((h, j) => (
                  <div key={j} className="flex justify-between items-start gap-2 text-[10px] font-mono">
                    <span className="text-[#666] shrink-0">{h.data}</span>
                    <span className="text-[#999] flex-1">{h.descricao}</span>
                    <span className={`shrink-0 font-[600] ${h.pontos > 0 ? "text-[#00e55b]" : "text-[#FF3838]"}`}>
                      {h.pontos > 0 ? "+" : ""}{h.pontos.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notas internas */}
          <div>
            <h4 className="text-sm text-[#e0e0e0] font-mono font-[600] mb-3">Notas Internas</h4>
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 min-h-[120px]">
              <p className="text-xs text-[#e0e0e0] font-mono leading-relaxed">{clientes[perfilAberto].notaInterna}</p>
            </div>
            {clientes[perfilAberto].alocado > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-1">Teto de Risco</p>
                <p className={`text-xs font-mono font-[600] ${clientes[perfilAberto].score < 200 ? "text-[#FF3838]" : "text-[#00e55b]"}`}>
                  {clientes[perfilAberto].score < 200
                    ? "❌ OPERAÇÃO RECUSADA: Score muito baixo para este perfil."
                    : `✅ Cliente liberado para novos empréstimos (Score: ${clientes[perfilAberto].score} pts ≥ 200 pts)`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {cadastroAberto && (
        <CadastroCliente
          onSalvar={handleSalvarCadastro}
          onVoltar={() => setCadastroAberto(false)}
        />
      )}
    </div>
  )
}
