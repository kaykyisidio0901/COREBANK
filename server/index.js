import express from "express"
import cors from "cors"
import clientsRouter from "./routes/clients.js"
import loansRouter from "./routes/loans.js"
import paymentsRouter from "./routes/payments.js"
import dashboardRouter from "./routes/dashboard.js"

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use("/api/clients", clientsRouter)
app.use("/api/loans", loansRouter)
app.use("/api/payments", paymentsRouter)
app.use("/api/dashboard", dashboardRouter)

app.listen(PORT, () => {
  console.log(`[CoreBank Server] Rodando em http://localhost:${PORT}`)
})
