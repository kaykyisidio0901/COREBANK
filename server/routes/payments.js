import { Router } from "express"
import db from "../database.js"

const router = Router()

router.get("/", (req, res) => {
  const records = db.prepare(
    "SELECT * FROM payment_records ORDER BY date DESC"
  ).all()
  res.json(records)
})

router.post("/confirm", (req, res) => {
  const { installmentId, loanId, amount } = req.body

  if (!installmentId || !loanId) {
    return res.status(400).json({ error: "installmentId e loanId são obrigatórios" })
  }

  const installment = db.prepare("SELECT * FROM installments WHERE id = ? AND loan_id = ?").get(installmentId, loanId)
  if (!installment) return res.status(404).json({ error: "Parcela não encontrada" })

  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(loanId)
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(loan.client_id)

  const paidAt = new Date().toISOString().split("T")[0]

  db.prepare(
    "UPDATE installments SET status = 'paid', paid_at = ?, late_days = 0, late_fee = 0 WHERE id = ?"
  ).run(paidAt, installmentId)

  const clientName = client?.name || "Desconhecido"
  const desc = `Pagamento parcela R$ ${installment.amount} - ${clientName}`

  db.prepare(
    "INSERT INTO payment_records (client_id, client_name, amount, date, status, type, description) VALUES (?, ?, ?, ?, 'confirmed', 'received', ?)"
  ).run(client.id, clientName, installment.amount, paidAt, desc)

  const updated = db.prepare("SELECT * FROM installments WHERE id = ?").get(installmentId)
  res.json(updated)
})

export default router
