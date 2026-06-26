const API = "http://localhost:3001/api"

export async function fetchClients(filter?: string) {
  const params = filter && filter !== "todos" ? `?filter=${filter}` : ""
  const res = await fetch(`${API}/clients${params}`)
  return res.json()
}

export async function fetchClient(id: number) {
  const res = await fetch(`${API}/clients/${id}`)
  return res.json()
}

export async function createClient(data: { name: string; category: string; phone: string }) {
  const res = await fetch(`${API}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function createLoan(data: {
  clientId: number
  amount: number
  interestRate: number
  interestPeriod: string
  dueDates: string[]
}) {
  const res = await fetch(`${API}/loans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function confirmPayment(installmentId: number, loanId: number, amount: number) {
  const res = await fetch(`${API}/payments/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ installmentId, loanId, amount }),
  })
  return res.json()
}

export async function fetchPayments() {
  const res = await fetch(`${API}/payments`)
  return res.json()
}

export async function fetchDashboard() {
  const res = await fetch(`${API}/dashboard`)
  return res.json()
}
