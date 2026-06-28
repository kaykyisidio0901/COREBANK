import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppProvider, useApp } from "./context/AppContext"
import { Layout } from "./components/Layout"
import { Dashboard } from "./pages/Dashboard"
import { Clientes } from "./pages/Clientes"
import { Agenda } from "./pages/Agenda"
import { Caixa } from "./pages/Caixa"
import { GestaoCapital } from "./pages/GestaoCapital"
import { Configuracoes } from "./pages/Configuracoes"
import PainelAdmin from "./pages/PainelAdmin"
import Login from "./pages/Login"

function AppRoutes() {
  const { isAuthenticated } = useApp()
  if (!isAuthenticated) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/fluxo" element={<Caixa />} />
        <Route path="/capital" element={<GestaoCapital />} />
        <Route path="/config" element={<Configuracoes />} />
        <Route path="/admin" element={<PainelAdmin />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
