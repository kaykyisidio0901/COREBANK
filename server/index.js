import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import bcrypt from "bcryptjs"
import db from "./database.js"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// Serve built frontend in production
const __dirname = path.dirname(fileURLToPath(import.meta.url))
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")))
}

// ─── Multi‑tenant helper ───────────────────────────────────────────────
function requireTenant(req, res, next) {
  const tenantId = req.headers["x-tenant-id"]
  if (!tenantId) return res.status(401).json({ error: "x-tenant-id header required" })
  req.tenantId = tenantId
  next()
}

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"]
  if (token !== "corebank-admin-2024") return res.status(403).json({ error: "Acesso restrito a administradores" })
  next()
}

// ─── CLIENTES ──────────────────────────────────────────────────────────
app.get("/api/clientes", requireTenant, (req, res) => {
  const rows = db.prepare("SELECT * FROM clientes WHERE tenant_id = ? ORDER BY nome ASC").all(req.tenantId)
  const result = rows.map((c) => {
    const historicoScore = db.prepare("SELECT data, descricao, pontos FROM historico_score WHERE cliente_id = ? ORDER BY id DESC").all(c.id)
    return { ...c, historicoScore }
  })
  res.json(result)
})

app.get("/api/clientes/:id", requireTenant, (req, res) => {
  const row = db.prepare("SELECT * FROM clientes WHERE id = ? AND tenant_id = ?").get(req.params.id, req.tenantId)
  if (!row) return res.status(404).json({ error: "Cliente não encontrado" })
  const historicoScore = db.prepare("SELECT data, descricao, pontos FROM historico_score WHERE cliente_id = ? ORDER BY id DESC").all(row.id)
  res.json({ ...row, historicoScore })
})

app.post("/api/clientes", requireTenant, (req, res) => {
  const { id, nome, cpf, telefone, endereco, enderecoComercial, notaInterna, fep, telefone2, telefone3, enderecoSecundario, rgBase64, comprovanteBase64 } = req.body
  if (!id || !nome) return res.status(400).json({ error: "id e nome são obrigatórios" })

  // Prevent duplicate CPF within the same tenant
  if (cpf) {
    const existing = db.prepare("SELECT id FROM clientes WHERE tenant_id = ? AND cpf = ? AND id != ?").get(req.tenantId, cpf, id)
    if (existing) return res.status(409).json({ error: "CPF já cadastrado para outro cliente neste tenant", clienteExistenteId: existing.id })
  }

  db.prepare(`
    INSERT INTO clientes (id, tenant_id, nome, cpf, telefone, endereco, endereco_comercial, nota_interna, fep, telefone2, telefone3, endereco_secundario, rg_base64, comprovante_base64, score, nivel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 500, 'Baixo')
  `).run(id, req.tenantId, nome, cpf || "", telefone || "", endereco || "", enderecoComercial || "", notaInterna || "", fep || "", telefone2 || "", telefone3 || "", enderecoSecundario || "", rgBase64 || "", comprovanteBase64 || "")
  db.prepare("INSERT INTO historico_score (cliente_id, data, descricao, pontos) VALUES (?, date('now'), 'Cadastro inicial completo', 500)").run(id)
  const row = db.prepare("SELECT * FROM clientes WHERE id = ?").get(id)
  const historicoScore = db.prepare("SELECT data, descricao, pontos FROM historico_score WHERE cliente_id = ? ORDER BY id DESC").all(id)
  res.status(201).json({ ...row, historicoScore })
})

app.put("/api/clientes/:id", requireTenant, (req, res) => {
  const { id } = req.params
  const { rgBase64, comprovanteBase64, notaInterna } = req.body
  const existing = db.prepare("SELECT * FROM clientes WHERE id = ? AND tenant_id = ?").get(id, req.tenantId)
  if (!existing) return res.status(404).json({ error: "Cliente não encontrado" })
  const fields = []
  const values = []
  if (rgBase64 !== undefined) { fields.push("rg_base64 = ?"); values.push(rgBase64) }
  if (comprovanteBase64 !== undefined) { fields.push("comprovante_base64 = ?"); values.push(comprovanteBase64) }
  if (notaInterna !== undefined) { fields.push("nota_interna = ?"); values.push(notaInterna) }
  if (fields.length > 0) {
    values.push(id, req.tenantId)
    db.prepare(`UPDATE clientes SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`).run(...values)
  }
  const row = db.prepare("SELECT * FROM clientes WHERE id = ?").get(id)
  const historicoScore = db.prepare("SELECT data, descricao, pontos FROM historico_score WHERE cliente_id = ? ORDER BY id DESC").all(id)
  res.json({ ...row, historicoScore })
})

// ─── CONTRATOS ─────────────────────────────────────────────────────────
app.get("/api/contratos", requireTenant, (req, res) => {
  const rows = db.prepare("SELECT * FROM contratos WHERE tenant_id = ? ORDER BY data_criacao DESC").all(req.tenantId)
  const result = rows.map((c) => {
    const parcelas = db.prepare("SELECT * FROM parcelas WHERE contrato_id = ? ORDER BY numero ASC").all(c.id)
    return { ...c, parcelas }
  })
  res.json(result)
})

app.post("/api/contratos", requireTenant, (req, res) => {
  const { id, clienteId, nome, cpf, telefone, valorPrincipal, valorTotal, taxa, tipoJuros, numParcelas, intervalo, dataCriacao, hash, parcelas } = req.body
  if (!id) return res.status(400).json({ error: "id é obrigatório" })

  db.prepare(`
    INSERT INTO contratos (id, tenant_id, cliente_id, nome, cpf, telefone, valor_principal, valor_total, taxa, tipo_juros, num_parcelas, intervalo, data_criacao, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.tenantId, clienteId, nome, cpf || "", telefone || "", valorPrincipal, valorTotal, taxa, tipoJuros, numParcelas, intervalo, dataCriacao, hash)

  const insertParcela = db.prepare("INSERT INTO parcelas (contrato_id, numero, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)")
  const tx = db.transaction(() => {
    for (const p of parcelas) {
      insertParcela.run(id, p.numero, p.valor, p.vencimento, p.status || "Aguardando")
    }
  })
  tx()

  // Update client devedor/alocado
  db.prepare("UPDATE clientes SET alocado = alocado + ?, devedor = devedor + ? WHERE id = ? AND tenant_id = ?")
    .run(valorPrincipal, valorTotal, clienteId, req.tenantId)

  // Add score history
  db.prepare("INSERT INTO historico_score (cliente_id, data, descricao, pontos) VALUES (?, date('now'), ?, 200)")
    .run(clienteId, `Novo contrato ${hash} — R$ ${valorPrincipal.toFixed(2)} liberado`)

  const contrato = db.prepare("SELECT * FROM contratos WHERE id = ?").get(id)
  const parcelasRow = db.prepare("SELECT * FROM parcelas WHERE contrato_id = ? ORDER BY numero ASC").all(id)
  res.status(201).json({ ...contrato, parcelas: parcelasRow })
})

app.get("/api/contratos/:id", requireTenant, (req, res) => {
  const row = db.prepare("SELECT * FROM contratos WHERE id = ? AND tenant_id = ?").get(req.params.id, req.tenantId)
  if (!row) return res.status(404).json({ error: "Contrato não encontrado" })
  const parcelas = db.prepare("SELECT * FROM parcelas WHERE contrato_id = ? ORDER BY numero ASC").all(row.id)
  res.json({ ...row, parcelas })
})

app.delete("/api/contratos/:id", requireTenant, (req, res) => {
  const existing = db.prepare("SELECT * FROM contratos WHERE id = ? AND tenant_id = ?").get(req.params.id, req.tenantId)
  if (!existing) return res.status(404).json({ error: "Contrato não encontrado" })
  db.prepare("DELETE FROM contratos WHERE id = ? AND tenant_id = ?").run(req.params.id, req.tenantId)
  db.prepare("UPDATE clientes SET alocado = max(0, alocado - ?), devedor = max(0, devedor - ?) WHERE id = ? AND tenant_id = ?")
    .run(existing.valorPrincipal, existing.valorTotal, existing.clienteId, req.tenantId)
  res.json({ success: true })
})

// ─── TRANSAÇÕES / AUDITORIA ────────────────────────────────────────────
app.get("/api/transacoes", requireTenant, (req, res) => {
  const rows = db.prepare("SELECT * FROM transacoes WHERE tenant_id = ? ORDER BY id DESC").all(req.tenantId)
  res.json(rows)
})

app.post("/api/transacoes", requireTenant, (req, res) => {
  const { timestamp, tipo, descricao, origem, hash, valor, contratoId, clienteId } = req.body
  db.prepare("INSERT INTO transacoes (tenant_id, timestamp, tipo, descricao, origem, hash, valor, contrato_id, cliente_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(req.tenantId, timestamp, tipo, descricao || "", origem || "", hash || "", valor, contratoId || null, clienteId || null)
  res.status(201).json({ success: true })
})

// ─── PAGAMENTO ─────────────────────────────────────────────────────────
app.post("/api/pagamentos", requireTenant, (req, res) => {
  const { clienteNome, valor, contratoId } = req.body

  if (!clienteNome || typeof valor !== "number" || valor <= 0) {
    return res.status(400).json({ error: "clienteNome e valor (número positivo) são obrigatórios" })
  }

  // Find client by partial name match (within tenant)
  const cliente = db.prepare("SELECT * FROM clientes WHERE tenant_id = ? AND nome LIKE ?").get(req.tenantId, `%${clienteNome}%`)
  if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" })

  // Mark first unpaid installment as Paga
  const parcela = db.prepare(`
    SELECT p.* FROM parcelas p
    JOIN contratos c ON c.id = p.contrato_id
    WHERE c.cliente_id = ? AND p.status != 'Paga'
    ORDER BY p.numero ASC LIMIT 1
  `).get(cliente.id)
  if (parcela) {
    db.prepare("UPDATE parcelas SET status = 'Paga' WHERE id = ?").run(parcela.id)
  }

  // Reduce client devedor
  const novoDevedor = Math.max(0, cliente.devedor - valor)
  db.prepare("UPDATE clientes SET devedor = ?, ultimo_pgto = date('now') WHERE id = ?").run(novoDevedor, cliente.id)

  // Add score
  db.prepare("INSERT INTO historico_score (cliente_id, data, descricao, pontos) VALUES (?, date('now'), ?, 100)")
    .run(cliente.id, `Pagamento de R$ ${valor.toFixed(2)} recebido${contratoId ? ` (${contratoId})` : ""}`)

  // Register transaction
  const now = new Date()
  const ts = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`
  db.prepare("INSERT INTO transacoes (tenant_id, timestamp, tipo, descricao, origem, hash, valor, contrato_id, cliente_id) VALUES (?, ?, 'ENTRADA', ?, ?, ?, ?, ?, ?)")
    .run(req.tenantId, ts, `Pagamento recebido de ${cliente.nome}`, cliente.nome, `#${Math.random().toString(36).slice(2, 8)}`, valor, contratoId || null, cliente.id)

  res.json({ success: true, novoDevedor })
})

// ─── DASHBOARD ─────────────────────────────────────────────────────────
app.get("/api/dashboard", requireTenant, (req, res) => {
  const capitalAlocado = db.prepare("SELECT COALESCE(SUM(valor_principal), 0) as total FROM contratos WHERE tenant_id = ?").get(req.tenantId).total
  const projecaoRetorno = db.prepare("SELECT COALESCE(SUM(valor_total), 0) as total FROM contratos WHERE tenant_id = ?").get(req.tenantId).total
  const totalParcelas = db.prepare(`
    SELECT COUNT(*) as c FROM parcelas p
    JOIN contratos c ON c.id = p.contrato_id
    WHERE c.tenant_id = ?
  `).get(req.tenantId).c
  const parcelasAtrasadas = db.prepare(`
    SELECT COUNT(*) as c FROM parcelas p
    JOIN contratos c ON c.id = p.contrato_id
    WHERE c.tenant_id = ? AND p.status = 'Atrasada'
  `).get(req.tenantId).c
  const inadimplencia = totalParcelas > 0 ? Math.round((parcelasAtrasadas / totalParcelas) * 1000) / 10 : 0

  res.json({ capitalAlocado, projecaoRetorno, inadimplencia })
})

// ─── AUTH / PRIMEIRO ACESSO ────────────────────────────────────────────
app.post("/api/auth/check", (req, res) => {
  const { tenantId, operator } = req.body
  if (!tenantId || !operator) return res.status(400).json({ error: "tenantId e operator obrigatórios" })
  const tenant = db.prepare("SELECT * FROM tenants WHERE id = ? AND operator = ?").get(tenantId, operator)
  if (!tenant) return res.status(404).json({ error: "Empresa ou operador não encontrado" })
  if (tenant.status === "inativo") return res.status(403).json({ error: "Acesso bloqueado. Contate o administrador." })
  res.json({ primeiroAcesso: tenant.senha === "—", tenantId: tenant.id, operator: tenant.operator })
})

app.post("/api/auth/definir-senha", (req, res) => {
  const { tenantId, operator, senha } = req.body
  if (!tenantId || !operator || !senha) return res.status(400).json({ error: "Dados incompletos" })
  if (senha.length < 4) return res.status(400).json({ error: "Senha deve ter no mínimo 4 caracteres" })
  const tenant = db.prepare("SELECT * FROM tenants WHERE id = ? AND operator = ?").get(tenantId, operator)
  if (!tenant) return res.status(404).json({ error: "Empresa ou operador não encontrado" })
  const hash = bcrypt.hashSync(senha, 10)
  db.prepare("UPDATE tenants SET senha = ? WHERE id = ?").run(hash, tenantId)
  res.json({ success: true })
})

app.post("/api/auth/login", (req, res) => {
  const { tenantId, operator, senha } = req.body
  if (!tenantId || !operator || !senha) return res.status(400).json({ error: "Dados incompletos" })
  const tenant = db.prepare("SELECT * FROM tenants WHERE id = ? AND operator = ?").get(tenantId, operator)
  if (!tenant) return res.status(404).json({ error: "Empresa ou operador não encontrado" })
  if (tenant.status === "inativo") return res.status(403).json({ error: "Acesso bloqueado" })
  if (tenant.senha !== "—" && !bcrypt.compareSync(senha, tenant.senha)) return res.status(401).json({ error: "Senha incorreta" })
  db.prepare("UPDATE tenants SET ultimo_acesso = datetime('now') WHERE id = ?").run(tenantId)
  res.json({ success: true, tenantId: tenant.id, operator: tenant.operator })
})

// ─── TENANTS (admin) ────────────────────────────────────────────────────
app.get("/api/tenants", requireAdmin, (_req, res) => {
  const rows = db.prepare("SELECT * FROM tenants ORDER BY created_at DESC").all()
  res.json(rows)
})

app.post("/api/tenants", requireAdmin, (req, res) => {
  const { tenantId, operator } = req.body
  if (!tenantId || !operator) return res.status(400).json({ error: "tenantId e operator obrigatórios" })
  db.prepare("INSERT INTO tenants (id, operator) VALUES (?, ?)").run(tenantId, operator)
  const row = db.prepare("SELECT * FROM tenants WHERE id = ?").get(tenantId)
  res.status(201).json(row)
})

app.patch("/api/tenants/:id/status", requireAdmin, (req, res) => {
  const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(req.params.id)
  if (!tenant) return res.status(404).json({ error: "Tenant não encontrado" })
  const novoStatus = tenant.status === "ativo" ? "inativo" : "ativo"
  db.prepare("UPDATE tenants SET status = ? WHERE id = ?").run(novoStatus, req.params.id)
  res.json({ status: novoStatus })
})

// ─── CAIXA (saldo) ────────────────────────────────────────────────────
app.get("/api/caixa", requireTenant, (req, res) => {
  const entradas = db.prepare("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tenant_id = ? AND tipo IN ('ENTRADA', 'APORTE', 'PAGAMENTO')").get(req.tenantId).total
  const saidas = db.prepare("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tenant_id = ? AND tipo IN ('SAÍDA', 'SANGRIA', 'EMPRÉSTIMO')").get(req.tenantId).total
  res.json({ saldoDisponivel: entradas - saidas, entradas, saidas })
})

app.post("/api/caixa/aporte", requireTenant, (req, res) => {
  const { valor, origem } = req.body
  const now = new Date()
  const ts = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`
  db.prepare("INSERT INTO transacoes (tenant_id, timestamp, tipo, descricao, origem, hash, valor) VALUES (?, ?, 'APORTE', ?, ?, ?, ?)")
    .run(req.tenantId, ts, `Injeção de capital no caixa${origem ? ` (${origem})` : ""}`, origem || "Caixa Externo", `#${Math.random().toString(36).slice(2, 8)}`, valor)
  res.json({ success: true })
})

app.post("/api/caixa/sangria", requireTenant, (req, res) => {
  const { valor, motivo } = req.body
  const now = new Date()
  const ts = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`
  db.prepare("INSERT INTO transacoes (tenant_id, timestamp, tipo, descricao, origem, hash, valor) VALUES (?, ?, 'SANGRIA', ?, ?, ?, ?)")
    .run(req.tenantId, ts, `Retirada de lucro do caixa${motivo ? ` (${motivo})` : ""}`, motivo || "Sangria manual", `#${Math.random().toString(36).slice(2, 8)}`, valor)
  res.json({ success: true })
})

// ─── CONFIG / ESTADO ───────────────────────────────────────────────────
app.get("/api/estado", requireTenant, (req, res) => {
  const row = db.prepare("SELECT capital_minimo, teto_risco, is_camouflaged, camuflagem_skin FROM estado_tenant WHERE tenant_id = ?").get(req.tenantId)
  res.json(row || { capitalMinimo: 5000, tetoRisco: 5000, isCamouflaged: false, camuflagemSkin: "Planilha de Excel Corporativa" })
})

app.post("/api/estado", requireTenant, (req, res) => {
  const { capitalMinimo, tetoRisco, isCamouflaged, camuflagemSkin } = req.body
  db.prepare(`
    INSERT INTO estado_tenant (tenant_id, capital_minimo, teto_risco, is_camouflaged, camuflagem_skin)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(tenant_id) DO UPDATE SET
      capital_minimo = excluded.capital_minimo,
      teto_risco = excluded.teto_risco,
      is_camouflaged = excluded.is_camouflaged,
      camuflagem_skin = excluded.camuflagem_skin
  `).run(req.tenantId, capitalMinimo ?? 5000, tetoRisco ?? 5000, isCamouflaged ?? false, camuflagemSkin ?? "Planilha de Excel Corporativa")
  res.json({ success: true })
})

// ─── PANIC ──────────────────────────────────────────────────────────────
app.post("/api/panic", requireTenant, (req, res) => {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM historico_score WHERE cliente_id IN (SELECT id FROM clientes WHERE tenant_id = ?)").run(req.tenantId)
    db.prepare("DELETE FROM parcelas WHERE contrato_id IN (SELECT id FROM contratos WHERE tenant_id = ?)").run(req.tenantId)
    db.prepare("DELETE FROM contratos WHERE tenant_id = ?").run(req.tenantId)
    db.prepare("DELETE FROM transacoes WHERE tenant_id = ?").run(req.tenantId)
    db.prepare("DELETE FROM clientes WHERE tenant_id = ?").run(req.tenantId)
    db.prepare("DELETE FROM estado_tenant WHERE tenant_id = ?").run(req.tenantId)
  })
  tx()
  res.json({ success: true, message: "Todos os dados do tenant foram removidos." })
})

// SPA fallback — serve index.html for all non-API routes in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.sendFile(path.join(__dirname, "../dist/index.html"))
    } else {
      next()
    }
  })
}

// ─── START ─────────────────────────────────────────────────────────────
// Ensure estado_tenant table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS estado_tenant (
    tenant_id TEXT PRIMARY KEY,
    capital_minimo REAL DEFAULT 5000,
    teto_risco REAL DEFAULT 5000,
    is_camouflaged INTEGER DEFAULT 0,
    camuflagem_skin TEXT DEFAULT 'Planilha de Excel Corporativa',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );
`)

// Seed default admin tenant if none exist
const tenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants").get().count
if (tenantCount === 0) {
  const hash = bcrypt.hashSync("admin123", 10)
  db.prepare("INSERT INTO tenants (id, operator, senha) VALUES (?, 'admin', ?)").run("corebank", hash)
  console.log("[Seed] Tenant 'corebank' criado com operador 'admin' e senha 'admin123'")
}

app.listen(PORT, () => {
  console.log(`[CoreBank Server] Rodando em http://localhost:${PORT}`)
})
