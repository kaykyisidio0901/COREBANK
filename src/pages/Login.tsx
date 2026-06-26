import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState("")
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!tenant.trim() || !usuario.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.")
      return
    }
    login(tenant.trim(), usuario.trim())
    navigate("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-900 rounded-2xl p-8 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-[#00FF66] text-4xl font-mono font-bold tracking-tight drop-shadow-[0_0_12px_rgba(0,255,102,0.3)]">
            CORE-BANK
          </div>
          <div className="text-zinc-500 text-xs font-mono mt-1 tracking-widest uppercase">
            Terminal Multiempresas v2.0
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ID da Empresa */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-400 tracking-wider uppercase">
              ID da Empresa / Tenant Key
            </label>
            <input
              type="text"
              placeholder="Ex: 0x_banca_alpha"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] focus:drop-shadow-[0_0_4px_rgba(0,255,102,0.3)] transition-all font-mono text-sm"
            />
          </div>

          {/* Operador */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-400 tracking-wider uppercase">
              Operador / Usuário
            </label>
            <input
              type="text"
              placeholder="Digite seu codinome"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] focus:drop-shadow-[0_0_4px_rgba(0,255,102,0.3)] transition-all font-mono text-sm"
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-400 tracking-wider uppercase">
              Chave de Acesso / Senha
            </label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-10 outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] focus:drop-shadow-[0_0_4px_rgba(0,255,102,0.3)] transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#00FF66] transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  {showSenha ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {erro && (
            <div className="text-[#FF3838] text-xs font-mono text-center">
              {erro}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-black border border-[#00FF66] text-[#00FF66] font-mono font-bold text-sm rounded-xl hover:bg-[#00FF66]/10 hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.3)] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            INICIAR SESSÃO CRIPTOGRAFADA
          </button>
        </form>

        {/* Security footer */}
        <div className="mt-6 text-center">
          <div className="text-zinc-700 text-[10px] font-mono leading-relaxed">
            Aviso de segurança: Conexão ponta a ponta ativa.<br />
            IP registrado para auditoria.
          </div>
        </div>
      </div>
    </div>
  )
}
