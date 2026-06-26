import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.RENDER_DISK_PATH || __dirname
const dbPath = path.join(DATA_DIR, "corebank.db")

const db = new Database(dbPath)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    operator TEXT NOT NULL,
    senha TEXT DEFAULT '—',
    status TEXT DEFAULT 'ativo',
    created_at TEXT DEFAULT (datetime('now')),
    ultimo_acesso TEXT DEFAULT '—'
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT DEFAULT '',
    telefone TEXT DEFAULT '',
    alocado REAL DEFAULT 0,
    devedor REAL DEFAULT 0,
    ultimo_pgto TEXT DEFAULT '—',
    status TEXT DEFAULT 'em-dia',
    score INTEGER DEFAULT 0,
    nivel TEXT DEFAULT 'Baixo',
    endereco TEXT DEFAULT '',
    endereco_comercial TEXT DEFAULT '',
    nota_interna TEXT DEFAULT '',
    fep TEXT DEFAULT '',
    telefone2 TEXT DEFAULT '',
    telefone3 TEXT DEFAULT '',
    endereco_secundario TEXT DEFAULT '',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS contratos (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT DEFAULT '',
    telefone TEXT DEFAULT '',
    valor_principal REAL NOT NULL,
    valor_total REAL NOT NULL,
    taxa REAL NOT NULL,
    tipo_juros TEXT NOT NULL,
    num_parcelas INTEGER NOT NULL,
    intervalo TEXT NOT NULL,
    data_criacao TEXT NOT NULL,
    hash TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS parcelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contrato_id TEXT NOT NULL,
    numero INTEGER NOT NULL,
    valor REAL NOT NULL,
    vencimento TEXT NOT NULL,
    status TEXT DEFAULT 'Aguardando',
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT DEFAULT '',
    origem TEXT DEFAULT '',
    hash TEXT DEFAULT '',
    valor REAL NOT NULL,
    contrato_id TEXT,
    cliente_id TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS historico_score (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id TEXT NOT NULL,
    data TEXT NOT NULL,
    descricao TEXT NOT NULL,
    pontos INTEGER NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS estado_tenant (
    tenant_id TEXT PRIMARY KEY,
    capital_minimo REAL DEFAULT 5000,
    teto_risco REAL DEFAULT 5000,
    is_camouflaged INTEGER DEFAULT 0,
    camuflagem_skin TEXT DEFAULT 'Planilha de Excel Corporativa'
  );
`)

// Safe migrations (run on every start, ignore if column exists)
try { db.exec("ALTER TABLE clientes ADD COLUMN rg_base64 TEXT DEFAULT ''") } catch {}
try { db.exec("ALTER TABLE clientes ADD COLUMN comprovante_base64 TEXT DEFAULT ''") } catch {}

export default db
