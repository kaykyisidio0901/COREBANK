import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, "corebank.db")

const db = new Database(dbPath)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Comercial','Pessoal','Autónomo')),
    phone TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    interest_period TEXT NOT NULL CHECK(interest_period IN ('month','week')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','late')),
    paid_at TEXT,
    late_days INTEGER DEFAULT 0,
    late_fee REAL DEFAULT 0,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    client_name TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'pending_confirm' CHECK(status IN ('confirmed','pending_confirm')),
    type TEXT DEFAULT 'received' CHECK(type IN ('received','sent')),
    description TEXT DEFAULT '',
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`)

function seed() {
  const count = db.prepare("SELECT COUNT(*) as c FROM clients").get()
  if (count.c > 0) return

  const insertClient = db.prepare("INSERT INTO clients (name, category, phone) VALUES (?, ?, ?)")
  const insertLoan = db.prepare("INSERT INTO loans (client_id, amount, interest_rate, interest_period) VALUES (?, ?, ?, ?)")
  const insertInstallment = db.prepare("INSERT INTO installments (loan_id, due_date, amount, status, paid_at, late_days, late_fee) VALUES (?, ?, ?, ?, ?, ?, ?)")
  const insertPayment = db.prepare("INSERT INTO payment_records (client_id, client_name, amount, date, status, type, description) VALUES (?, ?, ?, ?, ?, ?, ?)")

  const tx = db.transaction(() => {
    insertClient.run("Marcos Mecânico", "Comercial", "5511999999991")
    insertClient.run("Cláudio Chaveiro", "Comercial", "5511999999992")
    insertClient.run("Ana Beatriz Cabeleireira", "Autónomo", "5511999999993")
    insertClient.run("Seu Jorge Mercearia", "Comercial", "5511999999994")
    insertClient.run("Dra. Renata Clínica", "Pessoal", "5511999999995")
    insertClient.run("Lucas Entregador", "Autónomo", "5511999999996")

    insertLoan.run(1, 5000, 10, "month")
    insertLoan.run(2, 2000, 15, "week")
    insertLoan.run(3, 3000, 12, "month")
    insertLoan.run(4, 8000, 8, "month")
    insertLoan.run(5, 10000, 7, "month")
    insertLoan.run(6, 1500, 20, "week")

    const today = new Date()
    const fmt = (d) => d.toISOString().split("T")[0]

    // Marcos: 5 parcels, first one due today
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() + i)
      const status = i === 0 ? "pending" : "pending"
      insertInstallment.run(1, fmt(d), 1100, status, null, 0, 0)
    }

    // Claudio: 4 parcels, first one late 4 days
    for (let i = 0; i < 4; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i * 7 - (i === 0 ? 4 : 0))
      const status = i === 0 ? "late" : "pending"
      const lateDays = i === 0 ? 4 : 0
      const lateFee = i === 0 ? 30 * 4 : 0
      insertInstallment.run(2, fmt(d), 575, status, null, lateDays, lateFee)
    }

    // Ana: 3 parcels
    for (let i = 0; i < 3; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() + i)
      const status = i === 0 ? "paid" : "pending"
      const paidAt = i === 0 ? fmt(new Date(today.getTime() - 2 * 86400000)) : null
      insertInstallment.run(3, fmt(d), 1120, status, paidAt, 0, 0)
    }

    // Seu Jorge: 6 parcels
    for (let i = 0; i < 6; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() + i)
      insertInstallment.run(4, fmt(d), 1450, "pending", null, 0, 0)
    }

    // Dra. Renata: 12 parcels (first 3 paid)
    for (let i = 0; i < 12; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() + i)
      const status = i < 3 ? "paid" : "pending"
      const paidAt = i < 3 ? fmt(new Date(today.getTime() - (3 - i) * 30 * 86400000)) : null
      insertInstallment.run(5, fmt(d), 950, status, paidAt, 0, 0)
    }

    // Lucas: 4 parcels
    for (let i = 0; i < 4; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i * 7)
      insertInstallment.run(6, fmt(d), 450, "pending", null, 0, 0)
    }

    // Payment records (audit trail)
    const past = (days) => fmt(new Date(today.getTime() - days * 86400000))
    insertPayment.run(3, "Ana Beatriz Cabeleireira", 1120, past(2), "confirmed", "received", "Pagamento parcela #1")
    insertPayment.run(5, "Dra. Renata Clínica", 950, past(35), "confirmed", "received", "Pagamento parcela #1")
    insertPayment.run(5, "Dra. Renata Clínica", 950, past(5), "confirmed", "received", "Pagamento parcela #2")
    insertPayment.run(5, "Dra. Renata Clínica", 950, past(1), "confirmed", "received", "Pagamento parcela #3")
    insertPayment.run(1, "Marcos Mecânico", 1100, past(30), "confirmed", "received", "Pagamento parcela #1")
    insertPayment.run(4, "Seu Jorge Mercearia", 1450, past(30), "confirmed", "received", "Pagamento parcela #1")
  })

  tx()
}

seed()

export default db
