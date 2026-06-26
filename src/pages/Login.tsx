import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import * as api from "../api/client"

type Etapa = "login" | "primeiro-acesso"

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState<Etapa>("login")
  const [tenant, setTenant] = useState("")
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [senhaConfirm, setSenhaConfirm] = useState("")
  const [showSenhaConfirm, setShowSenhaConfirm] = useState(false)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!tenant.trim() || !usuario.trim()) {
      setErro("Preencha o ID da empresa e o operador.")
      return
    }

    setLoading(true)
    try {
      const { ok, data } = await api.checkTenant(tenant.trim(), usuario.trim())
      if (!ok) {
        setErro(data?.error || "Credenciais inválidas.")
        setLoading(false)
        return
      }
      if (data.primeiroAcesso) {
        setEtapa("primeiro-acesso")
        setLoading(false)
        return
      }

      // Normal login with password
      const loginRes = await api.loginApi(tenant.trim(), usuario.trim(), senha)
      if (!loginRes.ok) {
        setErro(loginRes.data?.error || "Senha incorreta.")
        setLoading(false)
        return
      }
      login(tenant.trim(), usuario.trim())
      navigate("/")
    } catch {
      // If server is offline, fall back to local login (no password validation)
      login(tenant.trim(), usuario.trim())
      navigate("/")
    }
    setLoading(false)
  }

  async function handleDefinirSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!senha.trim() || senha.trim().length < 4) {
      setErro("A senha deve ter no mínimo 4 caracteres.")
      return
    }
    if (senha !== senhaConfirm) {
      setErro("As senhas não conferem.")
      return
    }

    setLoading(true)
    try {
      const { ok, data } = await api.definirSenha(tenant.trim(), usuario.trim(), senha.trim())
      if (!ok) {
        setErro(data?.error || "Erro ao definir senha.")
        setLoading(false)
        return
      }
      // Auto-login after setting password
      login(tenant.trim(), usuario.trim())
      navigate("/")
    } catch {
      // Offline fallback
      login(tenant.trim(), usuario.trim())
      navigate("/")
    }
    setLoading(false)
  }

  function voltar() {
    setEtapa("login")
    setSenha("")
    setSenhaConfirm("")
    setErro("")
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

        {etapa === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {erro && (
              <div className="text-[#FF3838] text-xs font-mono text-center">{erro}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-black border border-[#00FF66] text-[#00FF66] font-mono font-bold text-sm rounded-xl hover:bg-[#00FF66]/10 hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">bolt</span>
              {loading ? "VERIFICANDO..." : "INICIAR SESSÃO CRIPTOGRAFADA"}
            </button>
          </form>
        ) : (
          /* ─── PRIMEIRO ACESSO ─── */
          <form onSubmit={handleDefinirSenha} className="space-y-5">
            <div className="text-center mb-2">
              <span className="material-symbols-outlined text-[#00FF66] text-3xl">vpn_key</span>
              <h2 className="text-[#e0e0e0] font-mono font-[700] text-lg mt-2">Primeiro Acesso</h2>
              <p className="text-zinc-500 text-xs font-mono mt-1">
                {tenant} / {usuario}
              </p>
              <p className="text-zinc-600 text-[11px] font-mono mt-2">
                Crie sua chave de acesso para proteger sua conta.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-zinc-400 tracking-wider uppercase">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  placeholder="Mínimo 4 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-10 outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all font-mono text-sm"
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

            <div className="space-y-2">
              <label className="block text-xs font-mono text-zinc-400 tracking-wider uppercase">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showSenhaConfirm ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={senhaConfirm}
                  onChange={(e) => setSenhaConfirm(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-10 outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#00FF66] transition-colors"
                >
                  <span className="material-symbols-outlined text-base">
                    {showSenhaConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {erro && (
              <div className="text-[#FF3838] text-xs font-mono text-center">{erro}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-black border border-[#00FF66] text-[#00FF66] font-mono font-bold text-sm rounded-xl hover:bg-[#00FF66]/10 hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              {loading ? "SALVANDO..." : "DEFINIR SENHA E ACESSAR"}
            </button>

            <button
              type="button"
              onClick={voltar}
              className="w-full text-center text-zinc-600 text-xs font-mono hover:text-zinc-400 transition-colors"
            >
              Voltar
            </button>
          </form>
        )}

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
