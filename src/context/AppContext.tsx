import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react"
import type { Cliente, Contrato, ParcelaContrato, Transacao, TenantAdmin, FlowItem, DashboardData, CategoryRisk } from "../types"
import type { DadosCliente } from "../components/Dashboard/CadastroCliente"
import * as api from "../api/client"

function nowTimestamp() {
  const d = new Date()
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
}

function gerarHashCurto() {
  const hex = "0123456789abcdef"
  let h = "#"
  for (let i = 0; i < 4; i++) h += hex[Math.floor(Math.random() * 16)]
  h += "..."
  for (let i = 0; i < 4; i++) h += hex[Math.floor(Math.random() * 16)]
  return h
}

interface AppContextType {
  dashboard: DashboardData
  saldoDisponivel: number
  capitalMinimo: number
  tetoRisco: number
  saldoBaixo: boolean
  clientes: Cliente[]
  contratos: Contrato[]
  transacoes: Transacao[]
  flowItems: FlowItem[]
  injetarCapital: (valor: number, origem: string) => void
  retirarCapital: (valor: number, motivo: string) => void
  setCapitalMinimo: (valor: number) => void
  setTetoRisco: (valor: number) => void
  adicionarCliente: (dados: DadosCliente) => Cliente
  atualizarClienteLocal: (id: string, campos: Partial<Cliente>) => void
  adicionarContrato: (params: {
    clienteId: string
    nome: string
    cpf: string
    telefone: string
    valorPrincipal: number
    valorTotal: number
    taxa: number
    tipoJuros: "simples" | "compostos"
    numParcelas: number
    intervalo: "mensal" | "quinzenal" | "semanal"
    parcelas: ParcelaContrato[]
  }) => Contrato
  registrarPagamento: (clienteNome: string, valor: number, contratoId: string) => void
  isCamouflaged: boolean
  camuflagemSkin: string
  setCamuflagemSkin: (skin: string) => void
  toggleCamouflage: () => void
  panicMode: boolean
  ativarPanic: () => void
  tenantId: string
  user: string
  isAuthenticated: boolean
  login: (tenant: string, usuario: string) => void
  logout: () => void
  tenantsCadastrados: TenantAdmin[]
  adicionarTenant: (tenant: string, operator: string) => void
  toggleTenantStatus: (tenantId: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [saldoDisponivel, setSaldoDisponivel] = useState(0)
  const [capitalMinimo, setCapitalMinimo] = useState(5000)
  const [tetoRisco, setTetoRisco] = useState(5000)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [isCamouflaged, setIsCamouflaged] = useState(false)
  const [camuflagemSkin, setCamuflagemSkin] = useState("Planilha de Excel Corporativa")
  const [panicMode, setPanicMode] = useState(false)
  const [tenantId, setTenantId] = useState(() => localStorage.getItem("corebank_tenant") || "")
  const [user, setUser] = useState(() => localStorage.getItem("corebank_user") || "")
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("corebank_tenant"))
  const [tenantsCadastrados, setTenantsCadastrados] = useState<TenantAdmin[]>(() => {
    const saved = localStorage.getItem("corebank_tenants")
    return saved ? JSON.parse(saved) : []
  })

  const saldoBaixo = saldoDisponivel < capitalMinimo

  function saveTenantDataToStorage(tid: string) {
    if (!tid) return
    const data = {
      saldoDisponivel,
      capitalMinimo,
      tetoRisco,
      clientes,
      contratos,
      transacoes,
      isCamouflaged,
      camuflagemSkin,
      tenantsCadastrados,
    }
    localStorage.setItem(`corebank_data_${tid}`, JSON.stringify(data))
  }

  const dashboard = useMemo<DashboardData>(() => {
    const capitalAlocado = contratos.reduce((sum, c) => sum + c.valorPrincipal, 0)
    const totalParcelas = contratos.reduce((sum, c) => sum + c.parcelas.length, 0)
    const parcelasAtrasadas = contratos.reduce((sum, c) => sum + c.parcelas.filter((p) => p.status === "Atrasada").length, 0)
    const inadimplencia = totalParcelas > 0 ? parseFloat(((parcelasAtrasadas / totalParcelas) * 100).toFixed(1)) : 0
    const projecaoRetorno = contratos.reduce((sum, c) => sum + c.valorTotal, 0)

    // Group contracts into risk categories based on client score
    let baixo = 0, medio = 0, alto = 0
    contratos.forEach((c) => {
      const cliente = clientes.find((cl) => cl.id === c.clienteId)
      const score = cliente?.score ?? 500
      if (score >= 700) baixo++
      else if (score >= 300) medio++
      else alto++
    })
    const total = baixo + medio + alto || 1
    const categoryRisk: CategoryRisk[] = [
      { name: "Baixo Risco", value: parseFloat(((baixo / total) * 100).toFixed(1)), color: "#00e55b", contracts: baixo },
      { name: "Médio Risco", value: parseFloat(((medio / total) * 100).toFixed(1)), color: "#ffb4ab", contracts: medio },
      { name: "Alto Risco", value: parseFloat(((alto / total) * 100).toFixed(1)), color: "#FF3838", contracts: alto },
    ]

    return {
      capitalAlocado,
      projecaoRetorno,
      inadimplencia,
      saldoDisponivel,
      flow: [],
      categoryRisk,
    }
  }, [saldoDisponivel, contratos, clientes])

  const flowItems = useMemo<FlowItem[]>(() => {
    const items: FlowItem[] = []
    let counter = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    contratos.forEach((c) => {
      c.parcelas.forEach((p) => {
        const [day, month, year] = p.vencimento.split("/").map(Number)
        const dueDate = new Date(year, month - 1, day)
        dueDate.setHours(0, 0, 0, 0)

        const diffTime = today.getTime() - dueDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        let status: "pending" | "late" | "paid"
        let lateDays: number | undefined
        let lateFee: number | undefined

        if (p.status === "Paga") {
          status = "paid"
        } else if (diffDays > 0) {
          status = "late"
          lateDays = diffDays
          lateFee = p.valor * 0.01
        } else {
          status = "pending"
        }

        items.push({
          id: counter++,
          client: c.nome,
          value: p.valor,
          dueDate: p.vencimento,
          status,
          lateDays,
          lateFee,
        })
      })
    })

    if (items.length === 0) return []
    return items
  }, [contratos])

  const injetarCapital = (valor: number, origem: string) => {
    setSaldoDisponivel((prev) => prev + valor)
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    const origemStr = origem ? ` (${origem})` : ""
    const tx: Transacao = { timestamp: nowTimestamp(), tipo: "APORTE", descricao: "Injeção de capital no caixa", origem: origem || "Caixa Externo", hash: gerarHashCurto(), valor }
    setTransacoes((prev) => [tx, ...prev])
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CAPITAL] ${time} — Aporte de R$ ${valor.toFixed(2)} recebido${origemStr}. Novo saldo: R$ ${(saldoDisponivel + valor).toFixed(2)}.` }))
    api.aporteCapital(tenantId, valor, origem).catch((err) => console.warn("[API] aporteCapital falhou:", err))
  }

  const retirarCapital = (valor: number, motivo: string) => {
    setSaldoDisponivel((prev) => Math.max(0, prev - valor))
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    const motivoStr = motivo ? ` (${motivo})` : ""
    const tx: Transacao = { timestamp: nowTimestamp(), tipo: "SANGRIA", descricao: "Retirada de lucro do caixa", origem: motivo || "Sangria manual", hash: gerarHashCurto(), valor }
    setTransacoes((prev) => [tx, ...prev])
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CAPITAL] ${time} — Sangria de R$ ${valor.toFixed(2)} realizada${motivoStr}. Novo saldo: R$ ${Math.max(0, saldoDisponivel - valor).toFixed(2)}.` }))
    api.sangriaCapital(tenantId, valor, motivo).catch((err) => console.warn("[API] sangriaCapital falhou:", err))
  }

  const registrarPagamento = (clienteNome: string, valor: number, contratoId: string) => {
    setSaldoDisponivel((prev) => prev + valor)
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    // Find client by partial name match
    const cliente = clientes.find((c) => c.nome.toLowerCase().includes(clienteNome.toLowerCase()))
    if (cliente) {
      // Reduce devedor
      setClientes((prev) =>
        prev.map((c) => {
          if (c.id !== cliente.id) return c
          const novoDevedor = Math.max(0, c.devedor - valor)
          return {
            ...c,
            devedor: novoDevedor,
            ultimoPgto: now.toLocaleDateString("pt-BR"),
            historicoScore: [
              ...c.historicoScore,
              { data: now.toLocaleDateString("pt-BR"), descricao: `Pagamento de R$ ${valor.toFixed(2)} recebido${contratoId ? ` (${contratoId})` : ""}`, pontos: 100 },
            ],
          }
        })
      )

      // Mark first unpaid installment as Paga
      setContratos((prev) =>
        prev.map((ct) => {
          if (ct.clienteId !== cliente.id) return ct
          const jaTodasPagas = ct.parcelas.every((p) => p.status === "Paga")
          if (jaTodasPagas) return ct
          let encontrou = false
          const parcelasAtualizadas = ct.parcelas.map((p) => {
            if (encontrou || p.status === "Paga") return p
            encontrou = true
            return { ...p, status: "Paga" as const }
          })
          return { ...ct, parcelas: parcelasAtualizadas }
        })
      )
    }

    const tx: Transacao = { timestamp: nowTimestamp(), tipo: "PAGAMENTO", descricao: `Pagamento recebido de ${clienteNome}${cliente ? "" : " (cliente não localizado)"}`, origem: clienteNome, hash: gerarHashCurto(), valor, contratoId, clienteId: cliente?.id }
    setTransacoes((prev) => [tx, ...prev])
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CAIXA] ${time} — Pagamento de R$ ${valor.toFixed(2)} recebido de ${clienteNome}.${cliente ? ` Devedor atualizado: R$ ${Math.max(0, cliente.devedor - valor).toFixed(2)}.` : " Cliente não localizado no banco."} Contrato: ${contratoId}.` }))
    api.registrarPagamentoApi(tenantId, { clienteNome, valor, contratoId }).catch((err) => console.warn("[API] registrarPagamentoApi falhou:", err))
  }

  const toggleCamouflage = () => setIsCamouflaged((prev) => !prev)

  const ativarPanic = () => {
    api.panicApi(tenantId).catch(() => {})
    setPanicMode(true)
    setIsCamouflaged(false)
    setClientes([])
    setContratos([])
    setTransacoes([])
    setSaldoDisponivel(0)
    localStorage.clear()
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[PANIC] ${time} — PROTOCOLO DE EMERGÊNCIA ATIVADO. Todos os dados foram criptografados e removidos. SESSÃO ENCERRADA.` }))
    logout()
  }

  const login = async (tenant: string, usuario: string) => {
    // Save current tenant data before switching
    saveTenantDataToStorage(tenantId)

    setTenantId(tenant)
    setUser(usuario)
    setIsAuthenticated(true)
    localStorage.setItem("corebank_tenant", tenant)
    localStorage.setItem("corebank_user", usuario)

    // Try loading from server first
    try {
      const [clientesData, contratosData, transacoesData, caixaData] = await Promise.all([
        api.fetchClientes(tenant),
        api.fetchContratos(tenant),
        api.fetchTransacoes(tenant),
        api.fetchCaixa(tenant),
      ])
      setClientes(clientesData)
      setContratos(contratosData)
      setTransacoes(transacoesData)
      setSaldoDisponivel(caixaData.saldoDisponivel ?? 0)
      return
    } catch {
      // Server offline — fall back to localStorage
    }

    // Fallback: load from localStorage
    const saved = localStorage.getItem(`corebank_data_${tenant}`)
    if (saved) {
      try {
        const d = JSON.parse(saved)
        setSaldoDisponivel(d.saldoDisponivel ?? 0)
        setCapitalMinimo(d.capitalMinimo ?? 5000)
        setTetoRisco(d.tetoRisco ?? 5000)
        setClientes(d.clientes ?? [])
        setContratos(d.contratos ?? [])
        setTransacoes(d.transacoes ?? [])
        setIsCamouflaged(d.isCamouflaged ?? false)
        setCamuflagemSkin(d.camuflagemSkin ?? "Planilha de Excel Corporativa")
        return
      } catch { /* corrupted data, fall through to defaults */ }
    }
    // First access for this tenant — start clean
    setSaldoDisponivel(0)
    setCapitalMinimo(5000)
    setTetoRisco(5000)
    setClientes([])
    setContratos([])
    setTransacoes([])
    setIsCamouflaged(false)
    setCamuflagemSkin("Planilha de Excel Corporativa")
    setPanicMode(false)
  }

  const logout = () => {
    saveTenantDataToStorage(tenantId)
    setTenantId("")
    setUser("")
    setIsAuthenticated(false)
    setSaldoDisponivel(0)
    setClientes([])
    setContratos([])
    setTransacoes([])
    setCapitalMinimo(5000)
    setTetoRisco(5000)
    localStorage.removeItem("corebank_tenant")
    localStorage.removeItem("corebank_user")
  }

  const adicionarTenant = (tid: string, operator: string) => {
    const novo: TenantAdmin = {
      tenantId: tid,
      operator,
      senha: "—",
      status: "ativo",
      dataCriacao: new Date().toLocaleDateString("pt-BR"),
      ultimoAcesso: "—",
    }
    const updated = [...tenantsCadastrados, novo]
    setTenantsCadastrados(updated)
    localStorage.setItem("corebank_tenants", JSON.stringify(updated))
    api.createTenant({ tenantId: tid, operator }).catch((err) => console.warn("[API] createTenant falhou:", err))
  }

  const toggleTenantStatus = (tid: string) => {
    const updated = tenantsCadastrados.map((t) =>
      t.tenantId === tid ? { ...t, status: t.status === "ativo" ? "inativo" as const : "ativo" as const } : t
    )
    setTenantsCadastrados(updated)
    localStorage.setItem("corebank_tenants", JSON.stringify(updated))
    api.toggleTenantStatusApi(tid).catch((err) => console.warn("[API] toggleTenantStatusApi falhou:", err))
  }

  const adicionarCliente = (dados: DadosCliente): Cliente => {
    const hex = "0123456789abcdef"
    let hash = "0x"
    for (let i = 0; i < 8; i++) hash += hex[Math.floor(Math.random() * 16)]
    hash += "..."

    const hoje = new Date()
    const time = `${hoje.getHours().toString().padStart(2, "0")}:${hoje.getMinutes().toString().padStart(2, "0")}:${hoje.getSeconds().toString().padStart(2, "0")}`

    const novo: Cliente = {
      id: hash,
      nome: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone1,
      alocado: 0,
      devedor: 0,
      ultimoPgto: "—",
      status: "em-dia",
      score: 500,
      nivel: "Baixo",
      historicoScore: [{ data: hoje.toLocaleDateString("pt-BR"), descricao: "Cadastro inicial completo", pontos: 500 }],
      endereco: dados.enderecoPrincipal,
      enderecoComercial: dados.enderecoSecundario || "Mesmo endereço",
      notaInterna: "Cliente cadastrado via sistema.",
      fep: dados.fep,
      telefone2: dados.telefone2,
      telefone3: dados.telefone3,
      enderecoSecundario: dados.enderecoSecundario,
      rgBase64: dados.rgPreview || "",
      comprovanteBase64: dados.comprovantePreview || "",
    }

    setClientes((prev) => [...prev, novo])

    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CADASTRO] ${time} — Novo perfil confidencial cadastrado: ${dados.nome}. Pontuação inicial: 500 pts. ID: ${hash}.` }))

    api.createCliente(tenantId, {
      id: hash,
      nome: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone1,
      endereco: dados.enderecoPrincipal,
      enderecoComercial: dados.enderecoSecundario,
      notaInterna: "Cliente cadastrado via sistema.",
      fep: dados.fep || "",
      telefone2: dados.telefone2 || "",
      telefone3: dados.telefone3 || "",
      enderecoSecundario: dados.enderecoSecundario || "",
      rgBase64: dados.rgPreview || "",
      comprovanteBase64: dados.comprovantePreview || "",
    }).catch((err) => console.warn("[API] createCliente falhou:", err))

    return novo
  }

  const atualizarClienteLocal = (id: string, campos: Partial<Cliente>) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...campos } : c)))
    api.updateCliente(tenantId, id, campos).catch((err) => console.warn("[API] updateCliente falhou:", err))
  }

  const adicionarContrato = (params: {
    clienteId: string
    nome: string
    cpf: string
    telefone: string
    valorPrincipal: number
    valorTotal: number
    taxa: number
    tipoJuros: "simples" | "compostos"
    numParcelas: number
    intervalo: "mensal" | "quinzenal" | "semanal"
    parcelas: ParcelaContrato[]
  }): Contrato => {
    const hex = "0123456789abcdef"
    let hash = "CTR-"
    for (let i = 0; i < 8; i++) hash += hex[Math.floor(Math.random() * 16)]

    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    const contrato: Contrato = {
      id: hash,
      clienteId: params.clienteId,
      nome: params.nome,
      cpf: params.cpf,
      telefone: params.telefone,
      valorPrincipal: params.valorPrincipal,
      valorTotal: params.valorTotal,
      taxa: params.taxa,
      tipoJuros: params.tipoJuros,
      numParcelas: params.numParcelas,
      intervalo: params.intervalo,
      parcelas: params.parcelas,
      dataCriacao: now.toLocaleDateString("pt-BR"),
      hash: `#${hex.slice(0, 12)}`,
    }

    setContratos((prev) => [...prev, contrato])

    // Update client: add devedor, alocado, score history
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== params.clienteId) return c
        return {
          ...c,
          alocado: c.alocado + params.valorPrincipal,
          devedor: c.devedor + params.valorTotal,
          ultimoPgto: "Pendente",
          historicoScore: [
            ...c.historicoScore,
            { data: now.toLocaleDateString("pt-BR"), descricao: `Novo contrato ${hash} — R$ ${params.valorPrincipal.toFixed(2)} liberado`, pontos: 200 },
          ],
        }
      })
    )

    // Deduct from available balance
    setSaldoDisponivel((prev) => prev - params.valorPrincipal)

    // Log as SAÍDA in transacoes
    setTransacoes((prev) => [{ timestamp: nowTimestamp(), tipo: "EMPRÉSTIMO", descricao: `Novo empréstimo para ${params.nome}`, origem: params.nome, hash: gerarHashCurto(), valor: params.valorPrincipal, contratoId: hash, clienteId: params.clienteId }, ...prev])

    window.dispatchEvent(new CustomEvent("corebank:log", { detail: `[CONTRATO] ${time} — Contrato ${hash} registrado para ${params.nome}. Valor: R$ ${params.valorPrincipal.toFixed(2)}. Total c/ juros: R$ ${params.valorTotal.toFixed(2)} em ${params.numParcelas}x. Saldo debitado: R$ ${params.valorPrincipal.toFixed(2)}.` }))

    api.createContrato(tenantId, {
      id: contrato.id,
      clienteId: contrato.clienteId,
      nome: contrato.nome,
      cpf: contrato.cpf,
      telefone: contrato.telefone,
      valorPrincipal: contrato.valorPrincipal,
      valorTotal: contrato.valorTotal,
      taxa: contrato.taxa,
      tipoJuros: contrato.tipoJuros,
      numParcelas: contrato.numParcelas,
      intervalo: contrato.intervalo,
      dataCriacao: contrato.dataCriacao,
      hash: contrato.hash,
      parcelas: contrato.parcelas.map((p) => ({ numero: p.numero, valor: p.valor, vencimento: p.vencimento, status: p.status })),
    }).catch((err) => console.warn("[API] createContrato falhou:", err))

    return contrato
  }

  // Auto‑save whenever tenant data changes
  useEffect(() => {
    if (!tenantId) return
    saveTenantDataToStorage(tenantId)
  })

  // Fetch tenants from server when admin is authenticated
  useEffect(() => {
    if (user !== "admin" || tenantId !== "corebank") return
    api.fetchTenants()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TenantAdmin[] = data.map((t: Record<string, unknown>) => ({
            tenantId: t.id as string,
            operator: t.operator as string,
            senha: t.senha as string,
            status: t.status as "ativo" | "inativo",
            dataCriacao: t.created_at as string,
            ultimoAcesso: t.ultimo_acesso as string,
          }))
          setTenantsCadastrados(mapped)
          localStorage.setItem("corebank_tenants", JSON.stringify(mapped))
        }
      })
      .catch(() => {})
  }, [user, tenantId])

  return (
    <AppContext.Provider value={{ dashboard, flowItems, saldoDisponivel, capitalMinimo, tetoRisco, saldoBaixo, clientes, contratos, transacoes, injetarCapital, retirarCapital, setCapitalMinimo, setTetoRisco, adicionarCliente, atualizarClienteLocal, adicionarContrato, registrarPagamento, isCamouflaged, camuflagemSkin, setCamuflagemSkin, toggleCamouflage, panicMode, ativarPanic, tenantId, user, isAuthenticated, login, logout, tenantsCadastrados, adicionarTenant, toggleTenantStatus }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider")
  return ctx
}
