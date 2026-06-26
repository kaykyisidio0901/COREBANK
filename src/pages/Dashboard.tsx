import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { FlowTable } from "../components/Dashboard/FlowTable"
import { RiskChart } from "../components/Dashboard/RiskChart"
import { NovoEmprestimoModal } from "../components/Dashboard/NovoEmprestimoModal"
import * as XLSX from "xlsx"

function exportarRelatorio(clientes: import("../types").Cliente[], contratos: import("../types").Contrato[], transacoes: import("../types").Transacao[], flowItems: import("../types").FlowItem[], saldoDisponivel: number) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Fluxo de Recebimento
  const flowData = flowItems.map((f) => ({
    Devedor: f.client,
    Valor: f.value,
    Vencimento: f.dueDate,
    Status: f.status === "paid" ? "Pago" : f.status === "late" ? "Atrasado" : "Pendente",
    "Dias em Atraso": f.lateDays ?? 0,
  }))
  const wsFlow = XLSX.utils.json_to_sheet(flowData)
  XLSX.utils.book_append_sheet(wb, wsFlow, "Fluxo de Recebimento")

  // Sheet 2: Clientes
  const clientesData = clientes.map((c) => ({
    Nome: c.nome,
    CPF: c.cpf,
    Telefone: c.telefone,
    "Valor Alocado": c.alocado,
    Devedor: c.devedor,
    Status: c.status,
    Score: c.score,
    Nível: c.nivel,
  }))
  const wsClientes = XLSX.utils.json_to_sheet(clientesData)
  XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes")

  // Sheet 3: Contratos
  const contratosData = contratos.map((c) => ({
    Hash: c.hash,
    Cliente: c.nome,
    CPF: c.cpf,
    "Valor Principal": c.valorPrincipal,
    "Valor Total": c.valorTotal,
    Taxa: `${c.taxa}%`,
    Parcelas: c.numParcelas,
    Intervalo: c.intervalo,
  }))
  const wsContratos = XLSX.utils.json_to_sheet(contratosData)
  XLSX.utils.book_append_sheet(wb, wsContratos, "Contratos")

  // Sheet 4: Transações / Auditoria
  const transacoesData = transacoes.map((t) => ({
    Data: t.timestamp,
    Tipo: t.tipo,
    Descrição: t.descricao,
    Origem: t.origem,
    Valor: t.valor,
  }))
  const wsTransacoes = XLSX.utils.json_to_sheet(transacoesData)
  XLSX.utils.book_append_sheet(wb, wsTransacoes, "Auditoria")

  // Sheet 5: Resumo do Caixa
  const totalEntradas = transacoes.filter((t) => ["ENTRADA", "APORTE", "PAGAMENTO"].includes(t.tipo)).reduce((s, t) => s + t.valor, 0)
  const totalSaidas = transacoes.filter((t) => ["SAÍDA", "SANGRIA", "EMPRÉSTIMO"].includes(t.tipo)).reduce((s, t) => s + t.valor, 0)
  const caixaData = [
    { Indicador: "Saldo Disponível", Valor: saldoDisponivel },
    { Indicador: "Total de Entradas", Valor: totalEntradas },
    { Indicador: "Total de Saídas", Valor: totalSaidas },
    { Indicador: "Lucro Líquido", Valor: totalEntradas - totalSaidas },
  ]
  const wsCaixa = XLSX.utils.json_to_sheet(caixaData)
  XLSX.utils.book_append_sheet(wb, wsCaixa, "Resumo do Caixa")

  XLSX.writeFile(wb, `corebank_relatorio_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`)
}

export function Dashboard() {
  const { dashboard, saldoDisponivel, saldoBaixo, flowItems, clientes, contratos, transacoes } = useApp()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  const handleContratoGerado = (hash: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    const msg = `[CONTRATO] ${time} — Novo contrato gerado. Hash: ${hash}`
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: msg }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top header bar inside content */}
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Terminal de Operações / Painel Geral</h2>
          <p className="text-[10px] text-[#666] font-mono">SESSÃO ATIVA</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#666] font-mono">DISPONÍVEL</span>
          <span
            className={`text-lg font-mono font-[700] ${saldoBaixo ? "text-[#FF3838]" : "text-[#00e55b]"}`}
            style={{ filter: saldoBaixo ? "drop-shadow(0 0 8px rgba(255,56,56,0.5))" : "drop-shadow(0 0 8px rgba(0,255,102,0.5))" }}
          >
            R$ {saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <p className="text-[#999] text-xs font-mono uppercase tracking-wide">Capital Alocado (Mês Atual)</p>
          <div>
            <p className="text-[#00FF66] text-2xl font-bold font-mono tracking-wider" style={{ filter: "drop-shadow(0 0 8px rgba(0,255,102,0.4))" }}>
              R$ {dashboard.capitalAlocado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[#00FF66] text-xs font-mono mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              +12% vs mês anterior
            </p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <p className="text-[#999] text-xs font-mono uppercase tracking-wide">Projeção de Retorno</p>
          <div>
            <p className="text-[#00FF66] text-2xl font-bold font-mono tracking-wider" style={{ filter: "drop-shadow(0 0 8px rgba(0,255,102,0.4))" }}>
              R$ {dashboard.projecaoRetorno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[#00FF66] text-xs font-mono mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">analytics</span>
              Probabilidade: 94.2%
            </p>
          </div>
        </div>
        <div className="bg-[#ff3838]/5 border border-[#ff3838]/20 rounded-xl p-5 flex flex-col justify-between">
          <p className="text-[#999] text-xs font-mono uppercase tracking-wide">Índice de Inadimplência</p>
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[#FF3838] text-2xl font-bold font-mono tracking-wider">{dashboard.inadimplencia}%</p>
              <span className="px-2 py-0.5 text-[10px] font-mono font-[600] text-[#FF3838] border border-[#FF3838]/30 rounded">ACIMA DA MÉDIA</span>
            </div>
            <p className="text-[#FF3838] text-xs font-mono mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              Monitorar de perto
            </p>
          </div>
        </div>
      </div>

      {/* Table + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 w-full space-y-4">
          <h3 className="text-base md:text-lg text-[#e0e0e0] font-mono font-[600] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00e55b]">data_usage</span>
            Fluxo de Recebimento
          </h3>
          <div className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
            <FlowTable items={flowItems} />
          </div>
        </div>
        <div className="lg:col-span-5 w-full space-y-4">
          <h3 className="text-base md:text-lg text-[#e0e0e0] font-mono font-[600] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00e55b]">pie_chart</span>
            Risco da Carteira
          </h3>
          <div className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <RiskChart data={dashboard.categoryRisk} />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4">
          <h3 className="text-base md:text-lg text-[#e0e0e0] font-mono font-[600]">Ações Rápidas</h3>
          <button
            onClick={() => navigate("/capital")}
            className="w-full h-12 flex items-center justify-between px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:bg-zinc-800 transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00e55b]">add_circle</span>
              <span className="text-sm text-[#e0e0e0] font-mono truncate">INJETAR CAPITAL</span>
            </div>
            <span className="material-symbols-outlined text-[#666] group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full h-12 flex items-center justify-between px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:bg-zinc-800 transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00e55b]">request_quote</span>
              <span className="text-sm text-[#e0e0e0] font-mono truncate">NOVO EMPRÉSTIMO</span>
            </div>
            <span className="material-symbols-outlined text-[#666] group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
          <button
            onClick={() => exportarRelatorio(clientes, contratos, transacoes, flowItems, saldoDisponivel)}
            className="w-full h-12 flex items-center justify-between px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:bg-zinc-800 transition-all group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#666]">description</span>
              <span className="text-sm text-[#e0e0e0] font-mono truncate">EXPORTAR RELATÓRIO</span>
            </div>
            <span className="material-symbols-outlined text-[#666] group-hover:translate-x-1 transition-transform">download</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <NovoEmprestimoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onContratoGerado={handleContratoGerado}
      />
    </div>
  )
}
