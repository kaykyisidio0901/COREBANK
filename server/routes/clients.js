import { Router } from "express"
import db from "../database.js"

const router = Router()

function formatClient(row) {
  const loans = db.prepare(`
    SELECT * FROM loans WHERE client_id = ?
  `).all(row.id)

  const loansWithInstallments = loans.map((loan) => {
    const installments = db.prepare(`
      SELECT * FROM installments WHERE loan_id = ? ORDER BY due_date ASC
    `).all(loan.id)
    return { ...loan, installments }
  })

  return { ...row, loans: loansWithInstallments }
}

router.get("/", (req, res) => {
  const { filter } = req.query
  let rows
  if (filter === "em_dia") {
    rows = db.prepare(`
      SELECT DISTINCT c.* FROM clients c
      INNER JOIN loans l ON l.client_id = c.id
      INNER JOIN installments i ON i.loan_id = l.id
      WHERE i.status = 'pending' AND (i.late_days IS NULL OR i.late_days = 0)
      AND c.id NOT IN (
        SELECT DISTINCT c2.id FROM clients c2
        INNER JOIN loans l2 ON l2.client_id = c2.id
        INNER JOIN installments i2 ON i2.loan_id = l2.id
        WHERE i2.status = 'late'
      )
    `).all()
  } else if (filter === "em_atraso") {
    rows = db.prepare(`
      SELECT DISTINCT c.* FROM clients c
      INNER JOIN loans l ON l.client_id = c.id
      INNER JOIN installments i ON i.loan_id = l.id
      WHERE i.status = 'late'
    `).all()
  } else {
    rows = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all()
  }
  res.json(rows.map(formatClient))
})

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id)
  if (!row) return res.status(404).json({ error: "Cliente não encontrado" })
  res.json(formatClient(row))
})

router.post("/", (req, res) => {
  const { name, category, phone } = req.body
  if (!name || !category || !phone) {
    return res.status(400).json({ error: "name, category e phone são obrigatórios" })
  }
  const result = db.prepare("INSERT INTO clients (name, category, phone) VALUES (?, ?, ?)").run(name, category, phone)
  const client = formatClient(db.prepare("SELECT * FROM clients WHERE id = ?").get(result.lastInsertRowid))
  res.status(201).json(client)
})

export default router
