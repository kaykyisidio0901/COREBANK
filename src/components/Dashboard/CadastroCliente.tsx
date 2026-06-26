import { useState, useRef } from "react"
import { Upload, Home } from "lucide-react"

interface CadastroClienteProps {
  onSalvar: (dados: DadosCliente) => void
  onVoltar: () => void
}

export interface DadosCliente {
  nome: string
  cpf: string
  fep: string
  telefone1: string
  telefone2: string
  telefone3: string
  enderecoPrincipal: string
  enderecoSecundario: string
  rgFile: File | null
  rgPreview: string
  comprovanteFile: File | null
  comprovantePreview: string
}

function mascararCPF(valor: string) {
  const digits = valor.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

function mascararTelefone(valor: string) {
  const digits = valor.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function CadastroCliente({ onSalvar, onVoltar }: CadastroClienteProps) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [fep, setFep] = useState("")
  const [tel1, setTel1] = useState("")
  const [tel2, setTel2] = useState("")
  const [tel3, setTel3] = useState("")
  const [endPrincipal, setEndPrincipal] = useState("")
  const [endSecundario, setEndSecundario] = useState("")

  const [rgFile, setRgFile] = useState<File | null>(null)
  const [rgPreview, setRgPreview] = useState("")
  const [compFile, setCompFile] = useState<File | null>(null)
  const [compPreview, setCompPreview] = useState("")

  const rgRef = useRef<HTMLInputElement>(null)
  const compRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | null, setFile: (f: File | null) => void, setPreview: (s: string) => void) => {
    if (!file || file.size > 5 * 1024 * 1024) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSalvar = () => {
    onSalvar({
      nome,
      cpf,
      fep,
      telefone1: tel1,
      telefone2: tel2,
      telefone3: tel3,
      enderecoPrincipal: endPrincipal,
      enderecoSecundario: endSecundario,
      rgFile,
      rgPreview,
      comprovanteFile: compFile,
      comprovantePreview: compPreview,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg text-[#e0e0e0] font-mono font-[600]">Cadastrar Novo Perfil Confidencial</h2>
        <button onClick={onVoltar} className="text-[10px] font-mono text-[#666] hover:text-[#e0e0e0] transition-colors">
          VOLTAR
        </button>
      </div>

      {/* Dados Pessoais */}
      <div>
        <p className="text-[10px] text-[#00e55b] font-mono uppercase tracking-wider mb-3">Dados Pessoais</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Nome Completo *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Marcos da Silva"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">CPF *</label>
            <input type="text" value={cpf} onChange={(e) => setCpf(mascararCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">FEP / Registro Interno</label>
            <input type="text" value={fep} onChange={(e) => setFep(e.target.value)}
              placeholder="Ex: FEP-2024-001"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
        </div>
      </div>

      {/* Central de Contatos */}
      <div>
        <p className="text-[10px] text-[#00e55b] font-mono uppercase tracking-wider mb-3">Central de Contatos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Telefone 1 (Principal/WhatsApp) *</label>
            <input type="text" value={tel1} onChange={(e) => setTel1(mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Telefone 2 (Recado/Parente)</label>
            <input type="text" value={tel2} onChange={(e) => setTel2(mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Telefone 3 (Trabalho)</label>
            <input type="text" value={tel3} onChange={(e) => setTel3(mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
        </div>
      </div>

      {/* Endereços */}
      <div>
        <p className="text-[10px] text-[#00e55b] font-mono uppercase tracking-wider mb-3">Endereços Logísticos</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Endereço Principal *</label>
            <input type="text" value={endPrincipal} onChange={(e) => setEndPrincipal(e.target.value)}
              placeholder="Rua, número, bairro, cidade — CEP"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-[#666] font-mono block mb-1.5">Endereço Secundário (OPCIONAL)</label>
            <input type="text" value={endSecundario} onChange={(e) => setEndSecundario(e.target.value)}
              placeholder="Segunda base ou empresa"
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#e0e0e0] placeholder:text-[#666]/40 outline-none focus:border-[#00e55b]/50 transition-colors" />
          </div>
        </div>
      </div>

      {/* Central de Arquivos */}
      <div>
        <p className="text-[10px] text-[#00e55b] font-mono uppercase tracking-wider mb-3">Central de Arquivos e Provas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RG / CNH */}
          <div>
            <input ref={rgRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null, setRgFile, setRgPreview)} className="hidden" />
            {!rgFile ? (
              <div onClick={() => rgRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl p-5 text-center hover:border-[#00FF66]/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center">
                <Upload className="mx-auto mb-2 text-[#666]" size={24} />
                <p className="text-[10px] text-[#e0e0e0] font-mono">UPLOAD DO RG / CNH</p>
                <p className="text-[9px] text-[#666] font-mono mt-1">Frente e Verso</p>
              </div>
            ) : (
              <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {rgFile.type.startsWith("image/") && rgPreview ? (
                    <img src={rgPreview} alt="" className="w-9 h-9 rounded object-cover border border-zinc-700 shrink-0" />
                  ) : (
                    <Upload className="shrink-0 text-[#00e55b]" size={20} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#e0e0e0] font-mono truncate">{rgFile.name}</p>
                    <p className="text-[9px] text-[#00e55b] font-mono">{(rgFile.size / 1024).toFixed(1)} KB — OK</p>
                  </div>
                </div>
                <button onClick={() => { setRgFile(null); setRgPreview(""); if (rgRef.current) rgRef.current.value = "" }}
                  className="material-symbols-outlined text-[#FF3838] hover:text-[#ff6b6b] transition-colors text-base shrink-0">close</button>
              </div>
            )}
          </div>

          {/* Comprovante de Endereço */}
          <div>
            <input ref={compRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null, setCompFile, setCompPreview)} className="hidden" />
            {!compFile ? (
              <div onClick={() => compRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl p-5 text-center hover:border-[#00FF66]/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center">
                <Home className="mx-auto mb-2 text-[#666]" size={24} />
                <p className="text-[10px] text-[#e0e0e0] font-mono">UPLOAD DO COMPROVANTE DE ENDEREÇO</p>
                <p className="text-[9px] text-[#666] font-mono mt-1">Luz/Água recente</p>
              </div>
            ) : (
              <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {compFile.type.startsWith("image/") && compPreview ? (
                    <img src={compPreview} alt="" className="w-9 h-9 rounded object-cover border border-zinc-700 shrink-0" />
                  ) : (
                    <Home className="shrink-0 text-[#00e55b]" size={20} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#e0e0e0] font-mono truncate">{compFile.name}</p>
                    <p className="text-[9px] text-[#00e55b] font-mono">{(compFile.size / 1024).toFixed(1)} KB — OK</p>
                  </div>
                </div>
                <button onClick={() => { setCompFile(null); setCompPreview(""); if (compRef.current) compRef.current.value = "" }}
                  className="material-symbols-outlined text-[#FF3838] hover:text-[#ff6b6b] transition-colors text-base shrink-0">close</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ação final */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSalvar}
          disabled={!nome || !cpf || !tel1 || !endPrincipal}
          className="px-6 py-3 text-sm font-mono font-[600] text-[#00e55b] border border-[#00e55b]/50 rounded-lg hover:bg-[#00e55b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>💾</span>
          SALVAR PERFIL & INICIAR CONTRATO
        </button>
      </div>
    </div>
  )
}
