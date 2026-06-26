import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { MatrixBg } from "./MatrixBg"
import { MobileDrawer } from "./MobileDrawer"
import { useApp } from "../context/AppContext"

function DisguiseExcel() {
  const linhas = Array.from({ length: 15 }, (_, i) => i)
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-sans text-gray-800 font-bold">Relatório de Desempenho Financeiro — Q2 2026</h1>
            <p className="text-xs text-gray-500 font-sans">CoreBank S/A — Departamento de Controladoria</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-sans">Documento Interno</p>
            <p className="text-xs text-gray-500 font-sans">Confidencial</p>
          </div>
        </div>
        <table className="w-full border-collapse border border-gray-300 text-xs font-sans">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-bold">Cliente</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Contrato</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Valor (R$)</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Vencimento</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-gray-700 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-1.5 text-gray-600">Cliente Exemplo {i + 1}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">CTR-{(1000 + i).toString(16).toUpperCase()}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">{(Math.random() * 10000).toFixed(2)}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-600">{`${String(Math.floor(Math.random() * 28 + 1)).padStart(2, "0")}/07/2026`}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${i % 3 === 0 ? "bg-green-100 text-green-700" : i % 3 === 1 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {i % 3 === 0 ? "Pago" : i % 3 === 1 ? "Pendente" : "Atrasado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-[10px] text-gray-400 font-sans text-center">
          CoreBank S/A — Planilha Corporativa — Todos os direitos reservados
        </div>
      </div>
    </div>
  )
}

function DisguiseNews() {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-serif text-gray-900 font-bold">Financial Times • Brasil</h1>
          <p className="text-xs text-gray-500 font-sans">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="space-y-6">
          {[
            { titulo: "Mercado financeiro opera em alta com expectativa de corte de juros", resumo: "Ibovespa sobe 1,2% impulsionado por dados de inflação abaixo do esperado. Investidores aguardam decisão do Copom na próxima semana." },
            { titulo: "Dólar recua e fecha a R$ 5,02 com fluxo de capital estrangeiro", resumo: "Moeda norte-americana opera em queda pelo terceiro dia consecutivo, acompanhando o cenário externo favorável e a entrada de recursos." },
            { titulo: "Setor de tecnologia puxa recuperação da bolsa brasileira", resumo: "Ações de empresas de tecnologia sobem mais de 3% na sessão de hoje, liderando os ganhos do mercado acionário doméstico." },
          ].map((n, i) => (
            <div key={i}>
              <h2 className="text-lg font-serif text-gray-900 font-bold mb-1">{n.titulo}</h2>
              <p className="text-sm font-serif text-gray-600 leading-relaxed">{n.resumo}</p>
              <div className="border-t border-gray-100 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Disguise404() {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-mono text-gray-300 font-bold mb-4">404</h1>
        <h2 className="text-xl font-sans text-gray-500 mb-2">Página não encontrada</h2>
        <p className="text-sm font-sans text-gray-400 mb-6">O servidor não pôde encontrar o recurso solicitado.</p>
        <div className="inline-block bg-gray-200 rounded px-4 py-2 text-xs font-mono text-gray-500">
          GET /corebank/dashboard — HTTP/1.1 404 Not Found
        </div>
      </div>
    </div>
  )
}

function PanicScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl font-mono text-[#FF3838] font-bold" style={{ filter: "drop-shadow(0 0 20px rgba(255,56,56,0.6))" }}>
          ⚠
        </div>
        <h1 className="text-2xl font-mono text-[#FF3838] font-bold tracking-widest" style={{ filter: "drop-shadow(0 0 12px rgba(255,56,56,0.5))" }}>
          SESSÃO ENCERRADA
        </h1>
        <p className="text-sm font-mono text-[#FF3838]/70">
          DADOS CRIPTOGRAFADOS COM SUCESSO.
        </p>
        <p className="text-[10px] font-mono text-[#666] mt-8">
          Protocolo de Emergência — CoreBank
        </p>
      </div>
    </div>
  )
}

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { saldoBaixo, isCamouflaged, camuflagemSkin, toggleCamouflage, panicMode } = useApp()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault()
        toggleCamouflage()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggleCamouflage])

  return (
    <div className="flex flex-col w-full min-h-screen bg-black overflow-hidden">
      {panicMode && <PanicScreen />}

      {!panicMode && isCamouflaged && (
        <>
          {camuflagemSkin === "Planilha de Excel Corporativa" && <DisguiseExcel />}
          {camuflagemSkin === "Portal de Notícias Financeiras" && <DisguiseNews />}
          {camuflagemSkin === "Tela de Erro 404 do Servidor" && <Disguise404 />}
        </>
      )}

      {!panicMode && !isCamouflaged && (
        <>
          {saldoBaixo && (
            <div className="bg-[#FF3838]/10 border-b border-[#FF3838]/30 px-6 py-2 animate-pulse z-20 relative">
              <p className="text-xs text-[#FF3838] font-mono font-[600] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                OPERAÇÃO EM RISCO: Saldo abaixo do limite de segurança. Injete mais capital imediatamente.
              </p>
            </div>
          )}
          <div className="flex flex-row flex-1 overflow-hidden">
            <MatrixBg />
            <Sidebar onMenuToggle={() => setDrawerOpen(true)} />
            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <main className="flex-1 min-w-0 h-screen overflow-y-auto p-6 space-y-6 relative z-10">
              <Outlet />
            </main>
          </div>
        </>
      )}
    </div>
  )
}
