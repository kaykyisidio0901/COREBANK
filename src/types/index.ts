export interface FlowItem {
  id: number
  client: string
  value: number
  dueDate: string
  status: "pending" | "late" | "paid"
  lateDays?: number
  lateFee?: number
}

export interface CategoryRisk {
  name: string
  value: number
  color: string
  contracts: number
}

export interface HistoricoScore {
  data: string
  descricao: string
  pontos: number
}

export interface Cliente {
  id: string
  nome: string
  cpf: string
  telefone: string
  alocado: number
  devedor: number
  ultimoPgto: string
  status: "em-dia" | "critico" | "blacklist"
  score: number
  nivel: "Baixo" | "Médio" | "Elite"
  historicoScore: HistoricoScore[]
  endereco: string
  enderecoComercial: string
  notaInterna: string
}

export interface ParcelaContrato {
  numero: number
  valor: number
  vencimento: string
  status: "Aguardando" | "Atrasada" | "Paga"
}

export interface Contrato {
  id: string
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
  dataCriacao: string
  hash: string
}

export interface Transacao {
  timestamp: string
  tipo: "ENTRADA" | "SAÍDA" | "MULTA AUTO" | "APORTE" | "SANGRIA" | "EMPRÉSTIMO" | "PAGAMENTO"
  descricao: string
  origem: string
  hash: string
  valor: number
  contratoId?: string
  clienteId?: string
}

export interface DashboardData {
  capitalAlocado: number
  projecaoRetorno: number
  inadimplencia: number
  saldoDisponivel: number
  flow: FlowItem[]
  categoryRisk: CategoryRisk[]
}

export interface TenantAdmin {
  tenantId: string
  operator: string
  senha: string
  status: "ativo" | "inativo"
  dataCriacao: string
  ultimoAcesso: string
}
