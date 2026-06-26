const API = "http://localhost:3001/api"

function headers(tenantId?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (tenantId) h["x-tenant-id"] = tenantId
  return h
}

// ─── AUTH ──────────────────────────────────────────────────────────────
export async function checkTenant(tenantId: string, operator: string) {
  const res = await fetch(`${API}/auth/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, operator }),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function definirSenha(tenantId: string, operator: string, senha: string) {
  const res = await fetch(`${API}/auth/definir-senha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, operator, senha }),
  })
  return { ok: res.ok, data: await res.json() }
}

export async function loginApi(tenantId: string, operator: string, senha: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, operator, senha }),
  })
  return { ok: res.ok, data: await res.json() }
}

// ─── CLIENTES ──────────────────────────────────────────────────────────
export async function fetchClientes(tenantId: string) {
  const res = await fetch(`${API}/clientes`, { headers: headers(tenantId) })
  return res.json()
}

export async function createCliente(tenantId: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/clientes`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateCliente(tenantId: string, id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/clientes/${id}`, {
    method: "PUT",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─── CONTRATOS ─────────────────────────────────────────────────────────
export async function fetchContratos(tenantId: string) {
  const res = await fetch(`${API}/contratos`, { headers: headers(tenantId) })
  return res.json()
}

export async function fetchContrato(tenantId: string, id: string) {
  const res = await fetch(`${API}/contratos/${id}`, { headers: headers(tenantId) })
  if (!res.ok) throw new Error("Contrato não encontrado")
  return res.json()
}

export async function deleteContrato(tenantId: string, id: string) {
  const res = await fetch(`${API}/contratos/${id}`, {
    method: "DELETE",
    headers: headers(tenantId),
  })
  return res.json()
}

export async function createContrato(tenantId: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/contratos`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─── TRANSAÇÕES ────────────────────────────────────────────────────────
export async function fetchTransacoes(tenantId: string) {
  const res = await fetch(`${API}/transacoes`, { headers: headers(tenantId) })
  return res.json()
}

export async function createTransacao(tenantId: string, data: Record<string, unknown>) {
  await fetch(`${API}/transacoes`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
}

// ─── PAGAMENTOS ────────────────────────────────────────────────────────
export async function registrarPagamentoApi(tenantId: string, data: { clienteNome: string; valor: number; contratoId: string }) {
  const res = await fetch(`${API}/pagamentos`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────
export async function fetchDashboard(tenantId: string) {
  const res = await fetch(`${API}/dashboard`, { headers: headers(tenantId) })
  return res.json()
}

// ─── CAIXA ─────────────────────────────────────────────────────────────
export async function fetchCaixa(tenantId: string) {
  const res = await fetch(`${API}/caixa`, { headers: headers(tenantId) })
  return res.json()
}

export async function aporteCapital(tenantId: string, valor: number, origem: string) {
  const res = await fetch(`${API}/caixa/aporte`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ valor, origem }),
  })
  return res.json()
}

export async function sangriaCapital(tenantId: string, valor: number, motivo: string) {
  const res = await fetch(`${API}/caixa/sangria`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ valor, motivo }),
  })
  return res.json()
}

// ─── TENANTS (ADMIN) ───────────────────────────────────────────────────
const ADMIN_TOKEN = "corebank-admin-2024"

function adminHeaders() {
  return { "Content-Type": "application/json", "x-admin-token": ADMIN_TOKEN }
}

export async function fetchTenants() {
  const res = await fetch(`${API}/tenants`, { headers: adminHeaders() })
  return res.json()
}

export async function createTenant(data: { tenantId: string; operator: string }) {
  const res = await fetch(`${API}/tenants`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function toggleTenantStatusApi(tenantId: string) {
  const res = await fetch(`${API}/tenants/${tenantId}/status`, { method: "PATCH", headers: adminHeaders() })
  return res.json()
}

// ─── ESTADO ────────────────────────────────────────────────────────────
export async function fetchEstado(tenantId: string) {
  const res = await fetch(`${API}/estado`, { headers: headers(tenantId) })
  return res.json()
}

export async function saveEstado(tenantId: string, data: Record<string, unknown>) {
  await fetch(`${API}/estado`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  })
}

export async function panicApi(tenantId: string) {
  await fetch(`${API}/panic`, { method: "POST", headers: headers(tenantId) })
}
