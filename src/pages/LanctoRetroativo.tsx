import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import type { Cliente, ParcelaContrato } from "../types"
import type { DadosCliente } from "../components/Dashboard/CadastroCliente"

function formatarData(d: Date) {
  const dia = d.getDate().toString().padStart(2, "0")
  const mes = (d.getMonth() + 1).toString().padStart(2, "0")
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

export function LanctoRetroativo() {
  const { clientes, adicionarCliente, adicionarContrato, atualizarClienteLocal } = useApp()
  const navigate = useNavigate()

  const [busca, setBusca] = useState("")
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)
  const [clienteNaoEncontrado, setClienteNaoEncontrado] = useState(false)

  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [telefone, setTelefone] = useState("")

  const [valor, setValor] = useState("")
  const [taxa, setTaxa] = useState("")
  const [tipoPrazo, setTipoPrazo] = useState<"30" | "personalizado">("30")
  const [dataInicio, setDataInicio] = useState("")
  const [dataVencimento, setDataVencimento] = useState("")

  const [rgFile, setRgFile] = useState<File | null>(null)
  const [rgPreview, setRgPreview] = useState("")
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [comprovantePreview, setComprovantePreview] = useState("")

  const rgRef = useRef<HTMLInputElement>(null)
  const comprovanteRef = useRef<HTMLInputElement>(null)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const valorNum = Number(valor.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0
  const taxaNum = Number(taxa.replace(",", ".")) || 0
  const valorTotalCalculado = taxaNum > 0 ? valorNum + (valorNum * taxaNum / 100) : valorNum

  function handleBuscar() {
    const termo = busca.trim().toLowerCase()
    if (!termo) return
    const encontrado = clientes.find(
      (c) => c.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")) || c.nome.toLowerCase().includes(termo)
    )
    if (encontrado) {
      setClienteEncontrado(encontrado)
      setClienteNaoEncontrado(false)
      setNome(encontrado.nome)
      setCpf(encontrado.cpf)
      setTelefone(encontrado.telefone)
    } else {
      setClienteEncontrado(null)
      setClienteNaoEncontrado(true)
      setNome(busca)
      setCpf("")
      setTelefone("")
    }
  }

  function handleRgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setRgFile(file)
    const reader = new FileReader()
    reader.onload = () => setRgPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleComprovanteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setComprovanteFile(file)
    const reader = new FileReader()
    reader.onload = () => setComprovantePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function calcularDataVencimento(): string {
    if (tipoPrazo === "personalizado" && dataVencimento) {
      return dataVencimento
    }
    const inicio = new Date(dataInicio + "T12:00:00")
    inicio.setDate(inicio.getDate() + 30)
    return inicio.toISOString().split("T")[0]
  }

  async function handleSalvar() {
    setErro("")
    setSucesso("")

    if (!valorNum || valorNum <= 0) {
      setErro("Informe um valor válido.")
      return
    }
    if (!dataInicio) {
      setErro("Selecione a data de início do contrato.")
      return
    }
    if (tipoPrazo === "personalizado" && !dataVencimento) {
      setErro("Selecione a data de vencimento.")
      return
    }
    if (tipoPrazo === "personalizado" && dataVencimento < dataInicio) {
      setErro("A data de vencimento não pode ser anterior à data de início.")
      return
    }

    const cpfLimpo = cpf.replace(/\D/g, "")
    if (!clienteEncontrado && !nome.trim()) {
      setErro("Informe o nome do cliente.")
      return
    }

    setSalvando(true)

    try {
      let clienteId: string

      if (clienteEncontrado) {
        clienteId = clienteEncontrado.id
      } else {
        const dados: DadosCliente = {
          nome: nome.trim(),
          cpf: cpfLimpo,
          telefone1: telefone.replace(/\D/g, ""),
          telefone2: "",
          telefone3: "",
          fep: "",
          enderecoPrincipal: "",
          enderecoSecundario: "",
          rgFile: null,
          rgPreview: "",
          comprovanteFile: null,
          comprovantePreview: "",
        }
        const novo = adicionarCliente(dados)
        clienteId = novo.id
      }

      // Upload documents if provided
      if (rgFile) {
        const b64 = await fileToBase64(rgFile)
        atualizarClienteLocal(clienteId, { rgBase64: b64 })
      }
      if (comprovanteFile) {
        const b64 = await fileToBase64(comprovanteFile)
        atualizarClienteLocal(clienteId, { comprovanteBase64: b64 })
      }
      if (rgPreview && !rgFile) {
        atualizarClienteLocal(clienteId, { rgBase64: rgPreview })
      }
      if (comprovantePreview && !comprovanteFile) {
        atualizarClienteLocal(clienteId, { comprovanteBase64: comprovantePreview })
      }

      const dueDateStr = calcularDataVencimento()
      const dueDate = new Date(dueDateStr + "T12:00:00")
      const parcela: ParcelaContrato = {
        numero: 1,
        valor: valorTotalCalculado,
        vencimento: formatarData(dueDate),
        status: "Aguardando",
      }

      adicionarContrato({
        clienteId,
        nome: nome.trim(),
        cpf: cpfLimpo,
        telefone: telefone.replace(/\D/g, ""),
        valorPrincipal: valorNum,
        valorTotal: valorTotalCalculado,
        taxa: taxaNum,
        tipoJuros: "simples",
        numParcelas: 1,
        intervalo: "mensal",
        parcelas: [parcela],
        dataInicio,
        skipSaldo: true,
      })

      setSucesso("Contrato retroativo lançado com sucesso!")
      setTimeout(() => navigate("/"), 1500)
    } catch (err) {
      setErro("Erro ao salvar. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  function limparBusca() {
    setBusca("")
    setClienteEncontrado(null)
    setClienteNaoEncontrado(false)
    setNome("")
    setCpf("")
    setTelefone("")
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="w-full flex justify-between items-center pb-4 border-b border-zinc-900">
        <div>
          <h2 className="text-sm text-[#e0e0e0] font-mono font-[500]">Lançamento Retroativo / Importar Empréstimo Antigo</h2>
          <p className="text-[10px] text-[#666] font-mono">REGISTRO DE CONTRATO FORA DO SISTEMA</p>
        </div>
      </div>

      {erro && (
        <div className="p-3 rounded-lg bg-[#FF3838]/10 border border-[#FF3838]/30 text-xs text-[#FF3838] font-mono">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="p-3 rounded-lg bg-[#00e55b]/10 border border-[#00e55b]/30 text-xs text-[#00e55b] font-mono">
          {sucesso}
        </div>
      )}

      {/* Client search */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs text-[#e0e0e0] font-mono font-[600] uppercase tracking-wide">Identificação do Cliente</h3>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por CPF ou Nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] placeholder:text-[#555] outline-none focus:border-zinc-500 transition-colors"
          />
          {clienteEncontrado ? (
            <button
              onClick={limparBusca}
              className="px-3 py-2 text-xs font-mono font-[600] text-[#ffb4ab] border border-[#ffb4ab]/30 rounded-lg hover:bg-[#ffb4ab]/10 transition-colors"
            >
              LIMPAR
            </button>
          ) : (
            <button
              onClick={handleBuscar}
              className="px-4 py-2 text-xs font-mono font-[600] text-[#e0e0e0] border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              BUSCAR
            </button>
          )}
        </div>

        {clienteEncontrado && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00e55b]/5 border border-[#00e55b]/20">
            <span className="material-symbols-outlined text-[#00e55b] text-sm">check_circle</span>
            <span className="text-xs font-mono text-[#00e55b]">
              Cliente Cadastrado — {clienteEncontrado.nome} {clienteEncontrado.cpf && `(${clienteEncontrado.cpf})`}
            </span>
          </div>
        )}

        {clienteNaoEncontrado && !clienteEncontrado && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ffb4ab]/5 border border-[#ffb4ab]/20">
            <span className="material-symbols-outlined text-[#ffb4ab] text-sm">person_search</span>
            <span className="text-xs font-mono text-[#ffb4ab]">
              Cliente não encontrado — Preencha os dados abaixo para cadastrar
            </span>
          </div>
        )}

        {(clienteNaoEncontrado || clienteEncontrado) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#666] font-mono mb-1">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={!!clienteEncontrado}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] disabled:opacity-50 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#666] font-mono mb-1">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                disabled={!!clienteEncontrado}
                placeholder="000.000.000-00"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] disabled:opacity-50 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#666] font-mono mb-1">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={!!clienteEncontrado}
                placeholder="(11) 99999-9999"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] disabled:opacity-50 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Loan data */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs text-[#e0e0e0] font-mono font-[600] uppercase tracking-wide">Dados do Empréstimo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-[#666] font-mono mb-1">Valor Concedido (R$)</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="1.500,00"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] placeholder:text-[#555] outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#666] font-mono mb-1">Juros (%)</label>
            <input
              type="text"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              placeholder="10"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] placeholder:text-[#555] outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {taxaNum > 0 && (
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs font-mono text-[#999]">
            Valor Total: <span className="text-[#00e55b] font-[600]">R$ {valorTotalCalculado.toFixed(2)}</span>
            {" — "}Principal: R$ {valorNum.toFixed(2)} + Juros: R$ {(valorNum * taxaNum / 100).toFixed(2)}
          </div>
        )}

        <div>
          <label className="block text-[10px] text-[#666] font-mono mb-1">Data de Início (Retroativa)</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] text-[#666] font-mono mb-1">Prazo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTipoPrazo("30"); setDataVencimento("") }}
              className={`flex-1 px-4 py-2 text-xs font-mono font-[600] rounded-lg border transition-colors ${
                tipoPrazo === "30"
                  ? "border-[#00e55b]/40 text-[#00e55b] bg-[#00e55b]/5"
                  : "border-zinc-700 text-[#666] hover:border-zinc-600"
              }`}
            >
              30 DIAS
            </button>
            <button
              type="button"
              onClick={() => setTipoPrazo("personalizado")}
              className={`flex-1 px-4 py-2 text-xs font-mono font-[600] rounded-lg border transition-colors ${
                tipoPrazo === "personalizado"
                  ? "border-[#00e55b]/40 text-[#00e55b] bg-[#00e55b]/5"
                  : "border-zinc-700 text-[#666] hover:border-zinc-600"
              }`}
            >
              AVULSO
            </button>
          </div>
        </div>

        {tipoPrazo === "personalizado" && (
          <div>
            <label className="block text-[10px] text-[#666] font-mono mb-1">Data de Vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-[#e0e0e0] outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Document upload */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs text-[#e0e0e0] font-mono font-[600] uppercase tracking-wide">Documentos do Cliente</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-[#666] font-mono mb-1">RG / CNH</label>
            <div
              onClick={() => rgRef.current?.click()}
              className="w-full h-28 bg-zinc-900 border border-zinc-700 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden"
            >
              {rgPreview ? (
                <img src={rgPreview} alt="RG" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-[#555] font-mono">Clique para anexar</span>
              )}
            </div>
            <input ref={rgRef} type="file" accept="image/*" className="hidden" onChange={handleRgChange} />
            {rgFile && (
              <p className="text-[10px] text-[#666] font-mono mt-1 truncate">{rgFile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-[#666] font-mono mb-1">Comprovante de Endereço</label>
            <div
              onClick={() => comprovanteRef.current?.click()}
              className="w-full h-28 bg-zinc-900 border border-zinc-700 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden"
            >
              {comprovantePreview ? (
                <img src={comprovantePreview} alt="Comprovante" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-[#555] font-mono">Clique para anexar</span>
              )}
            </div>
            <input ref={comprovanteRef} type="file" accept="image/*" className="hidden" onChange={handleComprovanteChange} />
            {comprovanteFile && (
              <p className="text-[10px] text-[#666] font-mono mt-1 truncate">{comprovanteFile.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex-1 px-4 py-3 text-xs font-mono font-[600] text-[#666] border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors"
        >
          CANCELAR
        </button>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex-1 px-4 py-3 text-xs font-mono font-[600] text-[#00e55b] border border-[#00e55b]/30 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-50"
        >
          {salvando ? "SALVANDO..." : "LANÇAR CONTRATO RETROATIVO"}
        </button>
      </div>
    </div>
  )
}
