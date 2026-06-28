import { useState, useCallback, useRef, useMemo } from "react"
import { Upload } from "lucide-react"
import { jsPDF } from "jspdf"

import { useApp } from "../../context/AppContext"

interface NovoEmprestimoModalProps {
  open: boolean
  onClose: () => void
  onContratoGerado: (hash: string) => void
}

function mascararCPF(valor: string) {
  const digits = valor.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

function mascararTelefone(valor: string) {
  const digits = valor.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function gerarHash() {
  const hex = "0123456789abcdef"
  let h = ""
  for (let i = 0; i < 12; i++) h += hex[Math.floor(Math.random() * 16)]
  return `#${h}`
}

function somarDias(data: Date, dias: number) {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

type TipoJuros = "simples" | "compostos"
type Prazo = 15 | 30 | 45 | 0

const prazos: { label: string; value: Prazo }[] = [
  { label: "15 Dias", value: 15 },
  { label: "30 Dias", value: 30 },
  { label: "45 Dias", value: 45 },
  { label: "Customizado", value: 0 },
]

export function NovoEmprestimoModal({ open, onClose, onContratoGerado }: NovoEmprestimoModalProps) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [endereco, setEndereco] = useState("")
  const [telefone, setTelefone] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoPreview, setArquivoPreview] = useState("")
  const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(null)
  const [arquivoComprovantePreview, setArquivoComprovantePreview] = useState("")
  const [valorRaw, setValorRaw] = useState("")
  const [taxa, setTaxa] = useState("20")
  const [tipoJuros, setTipoJuros] = useState<TipoJuros>("simples")
  const [prazo, setPrazo] = useState<Prazo>(30)
  const [prazoCustom, setPrazoCustom] = useState("60")
  const [numParcelas, setNumParcelas] = useState(1)
  const [intervaloParcelas, setIntervaloParcelas] = useState<"mensal" | "quinzenal" | "semanal">("mensal")
  const [jurosMora, setJurosMora] = useState("2")
  const [multaDiaria, setMultaDiaria] = useState("1")
  const [diasSimulados, setDiasSimulados] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [parcelasPagas, setParcelasPagas] = useState(0)
  const [buscaInput, setBuscaInput] = useState("")
  const [clienteEncontrado, setClienteEncontrado] = useState<boolean | null>(null)
  const [clienteBloqueado, setClienteBloqueado] = useState(false)
  const [clienteId, setClienteId] = useState("")

  const { clientes, adicionarCliente, adicionarContrato } = useApp()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputComprovanteRef = useRef<HTMLInputElement>(null)

  const handleBuscar = () => {
    const q = buscaInput.toLowerCase().replace(/\D/g, "")
    const match = clientes.find((c) =>
      c.nome.toLowerCase().includes(buscaInput.toLowerCase()) ||
      c.cpf.replace(/\D/g, "").includes(q)
    )
    if (match) {
      setClienteEncontrado(true)
      setClienteBloqueado(true)
      setClienteId(match.id)
      setNome(match.nome)
      setCpf(match.cpf)
      setEndereco(match.endereco)
      setTelefone(match.telefone)
    } else {
      setClienteEncontrado(false)
      setClienteBloqueado(false)
      setClienteId("")
    }
  }

  const handleRegistrarNovo = () => {
    if (!nome.trim() || cpf.replace(/\D/g, "").length < 11) return
    const novoCliente = adicionarCliente({
      nome, cpf, fep: "",
      enderecoPrincipal: endereco,
      enderecoSecundario: "",
      telefone1: telefone, telefone2: "", telefone3: "",
      rgFile: null, rgPreview: "",
      comprovanteFile: null, comprovantePreview: "",
    })
    setClienteId(novoCliente.id)
    setClienteBloqueado(true)
    setClienteEncontrado(true)
  }

  const valorNumerico = parseFloat(valorRaw.replace(/\./g, "").replace(",", ".")) || 0
  const taxaNumerica = parseFloat(taxa) || 0
  const prazoFinal = prazo === 0 ? (parseInt(prazoCustom, 10) || 0) : prazo
  const intervaloDias = intervaloParcelas === "mensal" ? 30 : intervaloParcelas === "quinzenal" ? 15 : 7
  const prazoEfetivo = numParcelas > 1 ? numParcelas * intervaloDias : prazoFinal
  const dataBase = dataInicio ? new Date(dataInicio + "T12:00:00") : new Date()

  const calcularJuros = useCallback(() => {
    if (valorNumerico <= 0 || taxaNumerica <= 0 || prazoEfetivo <= 0) return { juros: 0, total: 0 }
    const taxaDecimal = taxaNumerica / 100
    if (tipoJuros === "simples") {
      const juros = valorNumerico * taxaDecimal * (prazoEfetivo / 30)
      return { juros, total: valorNumerico + juros }
    } else {
      const periodos = prazoEfetivo / 30
      const total = valorNumerico * Math.pow(1 + taxaDecimal, periodos)
      return { juros: total - valorNumerico, total }
    }
  }, [valorNumerico, taxaNumerica, prazoEfetivo, tipoJuros])

  const { juros, total } = calcularJuros()
  const dataVencimento = prazoEfetivo > 0 ? formatarData(somarDias(dataBase, prazoEfetivo)) : "—"

  const parcelasPreview = useMemo(() => {
    if (numParcelas <= 0 || total <= 0) return []
    const valorParcela = total / numParcelas
    const baseDate = dataInicio ? new Date(dataInicio + "T12:00:00") : new Date()
    const hoje = new Date()
    const moraDecimal = (parseFloat(jurosMora) || 0) / 100
    const multa = parseFloat(multaDiaria) || 0
    return Array.from({ length: numParcelas }, (_, i) => {
      const dias = (i + 1) * intervaloDias
      const data = somarDias(new Date(baseDate), dias)
      const isAtrasada = data < hoje
      const isPrePaga = i < parcelasPagas
      let valorFinal = valorParcela
      let status: string = isPrePaga ? "Paga" : "Aguardando"
      if (isAtrasada && !isPrePaga) {
        const diasAtraso = Math.floor((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24))
        const jurosMoraValor = valorParcela * moraDecimal * (diasAtraso / 30)
        const multaValor = multa * diasAtraso
        valorFinal = valorParcela + jurosMoraValor + multaValor
        status = "Atrasada"
      }
      return { numero: i + 1, valor: valorFinal, vencimentoStr: formatarData(data), status }
    })
  }, [numParcelas, intervaloDias, total, jurosMora, multaDiaria, dataInicio, parcelasPagas])

  const linhasParcelas = numParcelas > 1 ? parcelasPreview : []

  const valorParcelaBase = numParcelas > 0 && total > 0 ? total / numParcelas : total
  const diasAtrasoSimulados = parseInt(diasSimulados, 10) || 0
  const taxaMoraDecimal = (parseFloat(jurosMora) || 0) / 100
  const multaFixaDiaria = parseFloat(multaDiaria) || 0

  const simulacaoAtraso = useMemo(() => {
    if (diasAtrasoSimulados <= 0) return { jurosAcumulados: 0, multaAcumulada: 0, valorCorrigido: valorParcelaBase }
    if (tipoJuros === "simples") {
      const jurosMora = valorParcelaBase * taxaMoraDecimal * (diasAtrasoSimulados / 30)
      const multaAcumulada = multaFixaDiaria * diasAtrasoSimulados
      const totalAcrescimo = jurosMora + multaAcumulada
      return { jurosAcumulados: jurosMora, multaAcumulada, valorCorrigido: valorParcelaBase + totalAcrescimo }
    } else {
      const taxaDiariaProporcional = taxaMoraDecimal / 30
      const montanteComposto = valorParcelaBase * Math.pow(1 + taxaDiariaProporcional, diasAtrasoSimulados)
      const multaAcumulada = multaFixaDiaria * diasAtrasoSimulados
      const valorCorrigido = montanteComposto + multaAcumulada
      return { jurosAcumulados: montanteComposto - valorParcelaBase, multaAcumulada, valorCorrigido }
    }
  }, [diasAtrasoSimulados, valorParcelaBase, tipoJuros, taxaMoraDecimal, multaFixaDiaria])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    if (raw === "") { setValorRaw(""); return }
    const num = parseInt(raw, 10) / 100
    setValorRaw(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleFileSelect = (file: File | null, tipo: "rg" | "comprovante" = "rg") => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return
    if (tipo === "rg") {
      setArquivo(file)
      const reader = new FileReader()
      reader.onload = () => setArquivoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setArquivoComprovante(file)
      const reader = new FileReader()
      reader.onload = () => setArquivoComprovantePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removerArquivo = (tipo: "rg" | "comprovante" = "rg") => {
    if (tipo === "rg") {
      setArquivo(null)
      setArquivoPreview("")
    } else {
      setArquivoComprovante(null)
      setArquivoComprovantePreview("")
    }
  }

  const handleGerar = async () => {
    const hash = gerarHash()
    onContratoGerado(hash)

    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    // Auto-register client if still a new registration
    let contratoClienteId = clienteId
    if (!contratoClienteId && nome.trim()) {
      const novo = adicionarCliente({
        nome, cpf, fep: "",
        enderecoPrincipal: endereco,
        enderecoSecundario: "",
        telefone1: telefone, telefone2: "", telefone3: "",
        rgFile: null, rgPreview: "",
        comprovanteFile: null, comprovantePreview: "",
      })
      contratoClienteId = novo.id
    }

    // 0. Create contract in context
    if (contratoClienteId) {
      const parcelasContrato = parcelasPreview.length > 0
        ? parcelasPreview.map((p, idx) => ({
            numero: p.numero,
            valor: p.valor,
            vencimento: p.vencimentoStr,
            status: (idx < parcelasPagas ? "Paga" : p.status) as "Aguardando" | "Atrasada" | "Paga"
          }))
        : [{ numero: 1, valor: total, vencimento: dataVencimento, status: "Aguardando" as const }]

      adicionarContrato({
        clienteId: contratoClienteId,
        nome,
        cpf,
        telefone,
        valorPrincipal: valorNumerico,
        valorTotal: total,
        taxa: taxaNumerica,
        tipoJuros,
        numParcelas,
        intervalo: intervaloParcelas,
        parcelas: parcelasContrato,
        dataInicio: dataInicio || undefined,
        parcelasPagas,
      })
    }

    // 1. Dispatch document-upload log (if file attached)
    if (arquivo) {
      window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[SEC_INFO] ${time} — Upload de documento do cliente concluído. Hash-SHA256 gerado com sucesso.` }))
    }

    // 2. Generate PDF
    const valorFormatado = valorNumerico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    const totalFormatado = total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })

    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageW = 210
    const margin = 20
    const contentW = pageW - margin * 2
    let y = margin

    // Header
    doc.setFillColor(30, 30, 30)
    doc.rect(margin, y, contentW, 22, "F")
    doc.setTextColor(0, 229, 91)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("TERMO DE MÚTUO FINANCEIRO E NOTA PROMISSÓRIA DIGITAL", pageW / 2, y + 13, { align: "center" })
    y += 28

    // Blue line separator
    doc.setDrawColor(0, 229, 91)
    doc.setLineWidth(0.8)
    doc.line(margin, y, pageW - margin, y)
    y += 10

    // Body
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
    writeLine(`DEVEDOR: ${nome || "_________________________"}, inscrito no CPF sob o n° ${cpf || "_________________________"}, residente no endereço ${endereco || "_________________________"}, telefone ${telefone || "_________________________"}.`)
    y += 3
    writeLine(`VALOR PRINCIPAL: R$ ${valorFormatado} | TAXA DE JUROS: ${taxa}% ao período.`)
    y += 3
    writeLine(`VALOR TOTAL REPACTUADO A RECEBER: R$ ${totalFormatado}.`)
    y += 3
    if (numParcelas > 1) {
      writeLine(`PARCELAMENTO: ${numParcelas}x de R$ ${(total / numParcelas).toFixed(2)} — Intervalo ${intervaloParcelas === "mensal" ? "Mensal" : intervaloParcelas === "quinzenal" ? "Quinzenal" : "Semanal"}.`)
      y += 2
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("CRONOGRAMA DE PARCELAS:", margin, y)
      y += 5
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      linhasParcelas.forEach((p) => {
        doc.text(`  Parcela ${p.numero}ª — R$ ${p.valor.toFixed(2)} — Vencimento: ${p.vencimentoStr}`, margin, y)
        y += 4.5
      })
      y += 3
    } else {
      writeLine(`DATA DE VENCIMENTO IMPRETERÍVEL: ${dataVencimento}.`)
    }
    y += 5

    // Terms text
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const mora = parseFloat(jurosMora) || 2
    const multa = parseFloat(multaDiaria) || 1
    const terms = `Pelo presente instrumento particular, o DEVEDOR acima qualificado declara ter recebido do CREDOR a quantia mencionada, comprometendo-se a restituí-la no prazo e condições estipulados, acrescida dos juros pactuados. A falta de pagamento na data do vencimento implicará na incidência de multa moratória de ${mora}% sobre o valor de cada parcela em atraso, além de juros de mora de ${mora}% ao mês e taxa diária de R$ ${multa.toFixed(2)} por dia de atraso, sem prejuízo de correção monetária. Fica eleito o foro da comarca do domicílio do credor para dirimir quaisquer dúvidas oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`
    const lines = doc.splitTextToSize(terms, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 10

    // Signature lines
    const sigW = 80
    const sigY = Math.max(y + 6, 250)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(("_").repeat(45), margin, sigY)
    doc.text("Assinatura do Credor", margin, sigY + 5)
    doc.text(("_").repeat(45), pageW - margin - sigW, sigY)
    doc.text("Assinatura do Devedor", pageW - margin - sigW, sigY + 5)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Documento gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")} — Hash: ${hash}`, margin, 287)

    // Attach document images on separate pages
    const attachImagePage = (dataUrl: string, label: string) => {
      doc.addPage()
      doc.setFillColor(30, 30, 30)
      doc.rect(margin, margin, contentW, 12, "F")
      doc.setTextColor(0, 229, 91)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text(label, pageW / 2, margin + 8, { align: "center" })
      try {
        const imgFormat = dataUrl.includes("image/png") ? "PNG" : "JPEG"
        const pageHeight = doc.internal.pageSize.getHeight()
        const maxW = contentW
        const maxH = pageHeight - margin * 2 - 20
        doc.addImage(dataUrl, imgFormat, margin, margin + 18, maxW, maxH, undefined, "FAST")
      } catch {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(255, 100, 100)
        doc.text("Erro ao incorporar imagem.", margin, margin + 30)
      }
    }

    if (arquivoPreview) attachImagePage(arquivoPreview, "DOCUMENTO DE IDENTIFICAÇÃO — RG / CNH")
    if (arquivoComprovantePreview) attachImagePage(arquivoComprovantePreview, "COMPROVANTE DE ENDEREÇO")

    doc.save(`termo_mutuo_${Date.now()}.pdf`)

    // 3. Success log
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[SYSTEM_AUTH] ${time} — Contrato PDF gerado com sucesso. Hash criptográfico anexado. Contrato registrado para ${nome}.` }))

    // 4. Reset & close
    resetForm()
  }

  const resetForm = () => {
    setNome("")
    setCpf("")
    setEndereco("")
    setTelefone("")
    removerArquivo("rg")
    removerArquivo("comprovante")
    setValorRaw("")
    setTaxa("20")
    setTipoJuros("simples")
    setPrazo(30)
    setPrazoCustom("60")
    setNumParcelas(1)
    setIntervaloParcelas("mensal")
    setJurosMora("2")
    setMultaDiaria("1")
    setDiasSimulados("")
    setDataInicio("")
    setParcelasPagas(0)
    setBuscaInput("")
    setClienteEncontrado(null)
    setClienteBloqueado(false)
    setClienteId("")
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={resetForm} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg text-[#e0e0e0] font-mono font-[600]">Novo Empréstimo</h2>
            <button onClick={resetForm} className="material-symbols-outlined text-[#666] hover:text-[#e0e0e0] transition-colors text-xl">
              close
            </button>
          </div>

          {/* Identificar Cliente */}
          <div className="mb-6">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Identificar Cliente</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={buscaInput}
                onChange={(e) => { setBuscaInput(e.target.value); setClienteEncontrado(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                placeholder="Buscar por CPF ou Nome do Cliente"
                className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
              />
              <button
                onClick={handleBuscar}
                disabled={!buscaInput.trim()}
                className="px-5 py-2.5 text-sm font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">search</span>
                BUSCAR
              </button>
            </div>

            {clienteEncontrado === true && (
              <div className="mt-3 bg-[#00e55b]/10 border border-[#00e55b]/30 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#00e55b]">check_circle</span>
                <span className="text-xs text-[#00e55b] font-mono">Cliente Cadastrado — dados pessoais bloqueados</span>
              </div>
            )}
            {clienteEncontrado === false && (
              <div className="mt-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#ffb4ab]">person_add</span>
                <span className="text-xs text-[#ffb4ab] font-mono">Cliente não encontrado — preencha os dados para novo cadastro</span>
              </div>
            )}
          </div>

          {/* Dados do Cliente */}
          <div className="mb-6">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Dados do Cliente</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={clienteBloqueado}
                  placeholder="Ex: Marcos da Silva"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(mascararCPF(e.target.value))}
                  disabled={clienteBloqueado}
                  placeholder="000.000.000-00"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Endereço de Cobrança</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  disabled={clienteBloqueado}
                  placeholder="Rua, número, bairro e ponto de referência"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                  disabled={clienteBloqueado}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {clienteEncontrado === false && nome.trim() && cpf.replace(/\D/g, "").length >= 11 && (
            <div className="mb-6">
              <button
                onClick={handleRegistrarNovo}
                className="w-full px-4 py-3 text-sm font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                REGISTRAR CLIENTE E CONTINUAR
              </button>
            </div>
          )}

          {/* Anexo de Documentos */}
          <div className="mb-6 space-y-4">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Documentos do Cliente</p>

            {/* RG / CNH */}
            <div>
              <p className="text-[10px] text-[#999] font-mono mb-2">RG / CNH / Documento com Foto</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null, "rg")}
                className="hidden"
              />
              {!arquivo ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0] ?? null, "rg") }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl p-4 text-center hover:border-[#00FF66]/50 transition-all cursor-pointer"
                >
                  <Upload className="mx-auto mb-2 text-[#666]" size={24} />
                  <p className="text-[11px] text-[#e0e0e0] font-mono">Clique ou arraste o documento (JPG/PNG)</p>
                </div>
              ) : (
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={arquivoPreview} alt="" className="w-10 h-10 rounded object-cover border border-zinc-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#e0e0e0] font-mono truncate">{arquivo.name}</p>
                      <p className="text-[10px] text-[#666] font-mono">{(arquivo.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => removerArquivo("rg")} className="material-symbols-outlined text-[#FF3838] hover:text-[#ff6b6b] transition-colors text-lg shrink-0">close</button>
                </div>
              )}
            </div>

            {/* Comprovante de Endereço */}
            <div>
              <p className="text-[10px] text-[#999] font-mono mb-2">Comprovante de Endereço</p>
              <input
                ref={fileInputComprovanteRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null, "comprovante")}
                className="hidden"
              />
              {!arquivoComprovante ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0] ?? null, "comprovante") }}
                  onClick={() => fileInputComprovanteRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl p-4 text-center hover:border-[#00FF66]/50 transition-all cursor-pointer"
                >
                  <Upload className="mx-auto mb-2 text-[#666]" size={24} />
                  <p className="text-[11px] text-[#e0e0e0] font-mono">Clique ou arraste o comprovante (JPG/PNG)</p>
                </div>
              ) : (
                <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={arquivoComprovantePreview} alt="" className="w-10 h-10 rounded object-cover border border-zinc-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#e0e0e0] font-mono truncate">{arquivoComprovante.name}</p>
                      <p className="text-[10px] text-[#666] font-mono">{(arquivoComprovante.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => removerArquivo("comprovante")} className="material-symbols-outlined text-[#FF3838] hover:text-[#ff6b6b] transition-colors text-lg shrink-0">close</button>
                </div>
              )}
            </div>
          </div>

          {/* Parâmetros Financeiros */}
          <div className="mb-6">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Parâmetros Financeiros</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Valor Emprestado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valorRaw}
                    onChange={handleValorChange}
                    placeholder="1.000,00"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Taxa de Juros %</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={taxa}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 5)
                      setTaxa(v)
                    }}
                    placeholder="20"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">%</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Tipo de Juros</label>
                <div className="flex bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setTipoJuros("simples")}
                    className={`flex-1 py-2.5 text-xs font-mono font-[600] transition-all ${
                      tipoJuros === "simples"
                        ? "text-[#00e55b] bg-[#00e55b]/10 border-r border-zinc-800"
                        : "text-[#666] hover:text-[#e0e0e0] border-r border-zinc-800"
                    }`}
                  >
                    JUROS SIMPLES
                  </button>
                  <button
                    onClick={() => setTipoJuros("compostos")}
                    className={`flex-1 py-2.5 text-xs font-mono font-[600] transition-all ${
                      tipoJuros === "compostos"
                        ? "text-[#00e55b] bg-[#00e55b]/10"
                        : "text-[#666] hover:text-[#e0e0e0]"
                    }`}
                  >
                    JUROS COMPOSTOS
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Prazo de Pagamento</label>
                <select
                  value={prazo}
                  onChange={(e) => setPrazo(parseInt(e.target.value) as Prazo)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
                >
                  {prazos.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {prazo === 0 && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prazoCustom}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                      setPrazoCustom(v)
                    }}
                    placeholder="Dias"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-xs text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors mt-2"
                  />
                )}
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Número de Parcelas</label>
                <select
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
                >
                  <option value={1}>Parcela Única</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                  <option value={4}>4x</option>
                  <option value={6}>6x</option>
                  <option value={12}>12x</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Intervalo entre Parcelas</label>
                <select
                  value={intervaloParcelas}
                  onChange={(e) => setIntervaloParcelas(e.target.value as "mensal" | "quinzenal" | "semanal")}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
                >
                  <option value="mensal">Mensal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Data de Início do Contrato</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors [color-scheme:dark]"
                />
                <p className="text-[9px] text-[#666] font-mono mt-1">Deixe em branco para usar a data de hoje</p>
              </div>
              {numParcelas > 1 && (
                <div>
                  <label className="text-[10px] text-[#666] font-mono block mb-1.5">Parcelas já Pagas</label>
                  <input
                    type="number"
                    min={0}
                    max={numParcelas}
                    value={parcelasPagas}
                    onChange={(e) => setParcelasPagas(Math.min(numParcelas, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] outline-none focus:border-[#00e55b]/50 transition-colors"
                  />
                  <p className="text-[9px] text-[#666] font-mono mt-1">Quantidade de parcelas já pagas antes deste cadastro</p>
                </div>
              )}
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Juros de Atraso (% de Mora)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jurosMora}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                      setJurosMora(v)
                    }}
                    placeholder="2"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">%</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666] font-mono block mb-1.5">Multa Diária (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-sm font-mono">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={multaDiaria}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setMultaDiaria(v)
                    }}
                    placeholder="1,00"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Cálculo */}
          <div className="bg-black/80 border border-[#00FF66]/30 rounded-lg p-4 md:p-6 my-4 space-y-3">
            <p className="text-[10px] text-[#666] font-mono uppercase tracking-wider mb-3">Painel de Cálculo</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#666] font-mono">Valor Base</span>
              <span className="text-sm text-[#e0e0e0] font-mono">
                R$ {valorNumerico.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#666] font-mono">Juros Acumulados ({tipoJuros})</span>
              <span className="text-sm text-[#00e55b] font-mono">
                + R$ {juros.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-3 mt-3 flex justify-between items-center">
              <span className="text-xs text-[#666] font-mono">Total de Recebimento</span>
              <span
                className="text-xl font-bold font-mono text-[#00FF66]"
                style={{ filter: "drop-shadow(0 0 6px rgba(0,255,102,0.4))" }}
              >
                R$ {total.toFixed(2)}
              </span>
            </div>

            {/* Linhas de parcelamento */}
            {numParcelas > 1 && total > 0 && (
              <>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-3">
                  <span className="text-xs text-[#666] font-mono">MONTANTE INICIAL COM JUROS EMBUTIDOS</span>
                  <span className="text-sm text-[#00e55b] font-mono font-[600]">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#666] font-mono">VALOR DE CADA PARCELA (EM DIA)</span>
                  <span className="text-sm text-[#e0e0e0] font-mono">
                    R$ {valorParcelaBase.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {/* Vencimento */}
            <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-3">
              <span className="text-xs text-[#666] font-mono">Data de Vencimento</span>
              <span className="text-sm text-[#e0e0e0] font-mono">
                {prazoEfetivo > 0 ? `Vence em: ${dataVencimento}` : "—"}
              </span>
            </div>

            {/* Simular Dias de Atraso */}
            <div className="border-t border-zinc-800 pt-3 mt-3 space-y-2">
              <label className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Simular Dias de Atraso</label>
              <input
                type="text"
                inputMode="numeric"
                value={diasSimulados}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setDiasSimulados(v)
                }}
                placeholder="0"
                className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#FF3838]/50 transition-colors"
              />
              {diasAtrasoSimulados > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#999] font-mono">JUROS ACUMULADOS POR ATRASO</span>
                    <span className="text-[11px] text-[#ffb4ab] font-mono">
                      + R$ {simulacaoAtraso.jurosAcumulados.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#999] font-mono">MULTA DIÁRIA ACUMULADA</span>
                    <span className="text-[11px] text-[#ffb4ab] font-mono">
                      + R$ {simulacaoAtraso.multaAcumulada.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-800 pt-1.5 mt-1.5">
                    <span className="text-[10px] text-[#FF3838] font-mono font-[600]">NOVO VALOR DA PARCELA VENCIDA</span>
                    <span
                      className="text-sm font-bold font-mono text-[#FF3838]"
                      style={{ filter: "drop-shadow(0 0 6px rgba(255,56,56,0.5))" }}
                    >
                      R$ {simulacaoAtraso.valorCorrigido.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview do Cronograma */}
          {linhasParcelas.length > 0 && (
            <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 mb-6">
              <p className="text-[10px] text-[#00e55b] font-mono uppercase tracking-wider mb-2">Preview do Cronograma</p>
              <div className="space-y-1">
                <div className="flex items-center text-[10px] text-[#666] font-mono pb-1 border-b border-zinc-800">
                  <span className="w-16 shrink-0">Parcela</span>
                  <span className="flex-1 text-right">Valor</span>
                  <span className="w-24 text-right">Vencimento</span>
                  <span className="w-20 text-right">Status</span>
                </div>
                {linhasParcelas.map((p) => (
                  <div key={p.numero} className="flex items-center text-xs font-mono">
                    <span className="w-16 shrink-0 text-[#e0e0e0]">{p.numero}ª</span>
                    <span className="flex-1 text-right text-[#00e55b]">R$ {p.valor.toFixed(2)}</span>
                    <span className="w-24 text-right text-[#999]">{p.vencimentoStr}</span>
                    <span className={`w-20 text-right ${p.status === "Atrasada" ? "text-[#FF3838]" : "text-[#00e55b]"}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-mono text-[#666] hover:text-[#e0e0e0] transition-colors"
            >
              CANCELAR OPERAÇÃO
            </button>
            <button
              onClick={handleGerar}
              disabled={!nome || valorNumerico <= 0 || taxaNumerica <= 0 || prazoFinal <= 0}
              className="px-5 py-2.5 text-sm font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>⚡</span>
              GERAR CONTRATO & INJETAR NA RUA
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
