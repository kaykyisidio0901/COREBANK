import { Router } from "express"
import db from "../database.js"

const router = Router()

router.get("/", (req, res) => {
  const capitalAlocado = db.prepare(
    "SELECT COALESCE(SUM(l.amount), 0) as total FROM loans l"
  ).get().total

  const totalInvestido = db.prepare(
    "SELECT COALESCE(SUM(l.amount), 0) as total FROM loans l"
  ).get().total

  const totalJuros = db.prepare(`
    SELECT COALESCE(SUM(i.amount), 0) as total
    FROM installments i
    JOIN loans l ON l.id = i.loan_id
    WHERE i.status IN ('pending', 'late')
  `).get().total

  const projecaoRetorno = totalInvestido + (totalJuros - totalInvestido > 0 ? totalJuros - totalInvestido : totalJuros * 0.2)

  const totalInstallments = db.prepare("SELECT COUNT(*) as c FROM installments").get().c
  const lateInstallments = db.prepare("SELECT COUNT(*) as c FROM installments WHERE status = 'late'").get().c
  const taxaInadimplencia = totalInstallments > 0 ? Math.round((lateInstallments / totalInstallments) * 1000) / 10 : 0

  // Category breakdown
  const categoriaData = db.prepare(`
    SELECT c.category, COALESCE(SUM(l.amount), 0) as total
    FROM clients c
    LEFT JOIN loans l ON l.client_id = c.id
    GROUP BY c.category
  `).all()

  res.json({
    capitalAlocado,
    projecaoRetorno: Math.round(projecaoRetorno * 100) / 100,
    taxaInadimplencia,
    categoriaData,
    totalInvestido,
    totalJuros
  })
})

export default router
