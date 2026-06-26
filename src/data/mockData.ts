import type { DashboardData } from "../types"

export const mockDashboard: DashboardData = {
  capitalAlocado: 42500,
  projecaoRetorno: 51000,
  inadimplencia: 8.2,
  saldoDisponivel: 85000,
  flow: [
    {
      id: 1,
      client: "Marcos Borracharia",
      value: 1200,
      dueDate: new Date().toISOString().split("T")[0],
      status: "pending",
    },
    {
      id: 2,
      client: "Cláudio Chaveiro",
      value: 450,
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      status: "late",
      lateDays: 2,
      lateFee: 30,
    },
    {
      id: 3,
      client: "Ana Beatriz Cabeleireira",
      value: 1120,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      status: "pending",
    },
    {
      id: 4,
      client: "Seu Jorge Mercearia",
      value: 1450,
      dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
      status: "pending",
    },
    {
      id: 5,
      client: "Dra. Renata Clínica",
      value: 950,
      dueDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      status: "paid",
    },
  ],
  categoryRisk: [
    { name: "Comercial", value: 65, color: "#00FF66", contracts: 569 },
    { name: "Pessoal", value: 22, color: "#00e475", contracts: 192 },
    { name: "Autônomos", value: 13, color: "#ffb4ab", contracts: 115 },
  ],
}
