import { Router } from "express"
import db from "../database.js"

const router = Router()

router.post("/", (req, res) => {
  const { clientId, amount, interestRate, interestPeriod, dueDates } = req.body

  if (!clientId || !amount || !interestRate || !interestPeriod || !dueDates?.length) {
    return res.status(400).json({ error: "Dados incompletos para criar empréstimo" })
  }

  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId)
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" })

  const loanResult = db.prepare(
    "INSERT INTO loans (client_id, amount, interest_rate, interest_period) VALUES (?, ?, ?, ?)"
  ).run(clientId, amount, interestRate, interestPeriod)

  const loanId = loanResult.lastInsertRowid
  const installmentAmount = amount / dueDates.length

  const insertInstallment = db.prepare(
    "INSERT INTO installments (loan_id, due_date, amount) VALUES (?, ?, ?)"
  )

  const tx = db.transaction(() => {
    for (const dueDate of dueDates) {
      insertInstallment.run(loanId, dueDate, Math.round(installmentAmount * 100) / 100)
    }
  })
  tx()

  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId)
  const installments = db.prepare("SELECT * FROM installments WHERE loan_id = ? ORDER BY due_date ASC").all(loanId)

  // Create a pending payment record
  db.prepare(
    "INSERT INTO payment_records (client_id, client_name, amount, status, type, description) VALUES (?, ?, ?, 'pending_confirm', 'sent', ?)"
  ).run(clientId, client.name, amount, `Novo empréstimo de R$ ${amount}`)

  res.status(201).json({ ...loan, installments })
})

router.get("/:id", (req, res) => {
  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.id)
  if (!loan) return res.status(404).json({ error: "Empréstimo não encontrado" })
  const installments = db.prepare("SELECT * FROM installments WHERE loan_id = ? ORDER BY due_date ASC").all(loan.id)
  res.json({ ...loan, installments })
})

export default router
