import { useState, useMemo } from "react"
import { jsPDF } from "jspdf"
import { useApp } from "../../context/AppContext"
import { deleteContrato } from "../../api/client"

interface Props {
  contratoId: string | null
  onClose: () => void
  onDeleted?: () => void
}

function formatValor(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`
}

function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function ContratoDetailModal({ contratoId, onClose, onDeleted }: Props) {
  const { contratos, tenantId } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const contrato = useMemo(
    () => contratos.find((c) => c.id === contratoId) ?? null,
    [contratos, contratoId]
  )

  if (!contratoId || !contrato) return null
  const c = contrato

  const parcelasPagas = c.parcelas.filter((p) => p.status === "Paga").length
  const parcelasAtrasadas = c.parcelas.filter((p) => p.status === "Atrasada").length
  const totalPago = c.parcelas.filter((p) => p.status === "Paga").reduce((s, p) => s + p.valor, 0)
  const restante = c.valorTotal - totalPago

  function gerarPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageW = 210
    const margin = 20
    const contentW = pageW - margin * 2
    let y = margin

    doc.setFillColor(30, 30, 30)
    doc.rect(margin, y, contentW, 22, "F")
    doc.setTextColor(0, 229, 91)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("TERMO DE MÚTUO FINANCEIRO E NOTA PROMISSÓRIA DIGITAL", pageW / 2, y + 13, { align: "center" })
    y += 28

    doc.setDrawColor(0, 229, 91)
    doc.setLineWidth(0.8)
    doc.line(margin, y, pageW - margin, y)
    y += 10

    doc.setTextColor(40, 40, 40)
    const bodySize = 10.5
    const lineH = 6.5
    const writeLine = (text: string) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(bodySize)
      doc.text(text, margin, y, { maxWidth: contentW })
      y += lineH
    }

    writeLine(`EMISSOR/CREDOR: CORE-BANK OPERAÇÕES PRIVADAS`)
    y += 3
    writeLine(`DEVEDOR: ${c.nome}, inscrito no CPF sob o n° ${c.cpf || "_________________________"}, telefone ${c.telefone || "_________________________"}.`)
    y += 3
    writeLine(`VALOR PRINCIPAL: ${formatValor(c.valorPrincipal)} | TAXA DE JUROS: ${c.taxa}% ao período.`)
    y += 3
    writeLine(`VALOR TOTAL REPACTUADO A RECEBER: ${formatValor(c.valorTotal)}.`)
    y += 3
    writeLine(`PARCELAMENTO: ${c.numParcelas}x de ${formatValor(c.valorTotal / c.numParcelas)} — Intervalo ${c.intervalo === "mensal" ? "Mensal" : c.intervalo === "quinzenal" ? "Quinzenal" : "Semanal"}.`)
    y += 3
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("CRONOGRAMA DE PARCELAS:", margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    c.parcelas.forEach((p) => {
      const statusChar = p.status === "Paga" ? "[PAGA] " : p.status === "Atrasada" ? "[ATRASADA] " : "[PENDENTE] "
      doc.text(`  ${statusChar}Parcela ${p.numero}ª — ${formatValor(p.valor)} — Vencimento: ${p.vencimento}`, margin, y)
      y += 4.5
    })
    y += 5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const terms = `Pelo presente instrumento particular, o DEVEDOR acima qualificado declara ter recebido do CREDOR a quantia mencionada, comprometendo-se a restituí-la no prazo e condições estipulados, acrescida dos juros pactuados. A falta de pagamento na data do vencimento implicará na incidência de multa moratória de 2% sobre o valor de cada parcela em atraso, além de juros de mora de 2% ao mês e taxa diária de R$ 1,00 por dia de atraso, sem prejuízo de correção monetária. Fica eleito o foro da comarca do domicílio do credor para dirimir quaisquer dúvidas oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`
    const lines = doc.splitTextToSize(terms, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 10

    const sigW = 80
    const sigY = Math.max(y + 6, 250)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("_".repeat(45), margin, sigY)
    doc.text("Assinatura do Credor", margin, sigY + 5)
    doc.text("_".repeat(45), pageW - margin - sigW, sigY)
    doc.text("Assinatura do Devedor", pageW - margin - sigW, sigY + 5)

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Documento gerado em ${formatarData(new Date())} — Contrato: ${c.id} — Hash: ${c.hash}`, margin, 287)

    doc.save(`termo_mutuo_${c.id}.pdf`)
  }

  function handleDelete() {
    setDeleting(true)
    deleteContrato(tenantId, c.id)
      .then(() => {
        onDeleted?.()
        onClose()
      })
      .catch(() => setDeleting(false))
  }

  const parcelas = c.parcelas

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm text-[#e0e0e0] font-mono font-[600]">Detalhes do Contrato</h3>
            <p className="text-[10px] text-[#666] font-mono mt-0.5">ID: {c.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={gerarPDF}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono text-[#e0e0e0] bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono text-[#FF3838] bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span> Excluir
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#FF3838] font-mono">Confirmar?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-[11px] font-mono text-white bg-[#FF3838] hover:bg-[#cc2d2d] rounded-md transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : "Sim"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-[11px] font-mono text-[#666] bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Não
                </button>
              </div>
            )}
            <button onClick={onClose} className="text-[#666] hover:text-[#e0e0e0] ml-2">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Resumo financeiro */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Principal</p>
              <p className="text-sm text-[#e0e0e0] font-mono font-[600] mt-1">{formatValor(c.valorPrincipal)}</p>
            </div>
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Total c/ Juros</p>
              <p className="text-sm text-[#e0e0e0] font-mono font-[600] mt-1">{formatValor(c.valorTotal)}</p>
            </div>
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Juros ({c.tipoJuros})</p>
              <p className="text-sm text-[#e0e0e0] font-mono font-[600] mt-1">{c.taxa}%</p>
            </div>
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
              <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Parcelas</p>
              <p className="text-sm text-[#e0e0e0] font-mono font-[600] mt-1">{c.numParcelas}x {c.intervalo === "mensal" ? "mensais" : c.intervalo === "quinzenal" ? "quinzenais" : "semanais"}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#666]">Pagas: <span className="text-[#00e55b]">{parcelasPagas}/{c.parcelas.length}</span></span>
            <span className="text-[#666]">Atrasadas: <span className="text-[#FF3838]">{parcelasAtrasadas}</span></span>
            <span className="text-[#666]">Total pago: <span className="text-[#00e55b]">{formatValor(totalPago)}</span></span>
            <span className="text-[#666]">Restante: <span className="text-[#e0e0e0]">{formatValor(restante)}</span></span>
          </div>

          {/* Cliente info */}
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-2">Dados do Cliente</p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div><span className="text-[#666]">Nome: </span><span className="text-[#e0e0e0]">{c.nome}</span></div>
              {c.cpf && <div><span className="text-[#666]">CPF: </span><span className="text-[#e0e0e0]">{c.cpf}</span></div>}
              {c.telefone && <div><span className="text-[#666]">Tel: </span><span className="text-[#e0e0e0]">{c.telefone}</span></div>}
              <div><span className="text-[#666]">Criado em: </span><span className="text-[#e0e0e0]">{c.dataCriacao}</span></div>
            </div>
          </div>

          {/* Parcelas */}
          <div>
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-2">Cronograma de Parcelas</p>
            <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-zinc-800">
                  <tr className="text-[#666]">
                    <th className="p-3 font-medium">Nº</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Vencimento</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {parcelas.map((p) => (
                    <tr key={p.numero} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 text-[#e0e0e0]">{p.numero}ª</td>
                      <td className="p-3 text-[#e0e0e0]">{formatValor(p.valor)}</td>
                      <td className="p-3 text-[#666]">{p.vencimento}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                          p.status === "Paga"
                            ? "border-[#00e55b]/40 text-[#00e55b] bg-[#00e55b]/10"
                            : p.status === "Atrasada"
                              ? "border-[#FF3838]/40 text-[#FF3838] bg-[#FF3838]/10"
                              : "border-zinc-600/40 text-zinc-400 bg-zinc-800/30"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
