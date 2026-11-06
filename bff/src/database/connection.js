// Camada de infraestrutura: abre o banco SQLite (nativo do Node 22+) e cria as tabelas.
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { DB_FILE } = require('../config/env');

const db = new DatabaseSync(path.resolve(__dirname, '..', '..', DB_FILE));
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS profissionais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT
);
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'recepcao' CHECK (perfil IN ('admin', 'recepcao', 'profissional')),
  profissional_id INTEGER REFERENCES profissionais(id), -- só para o perfil "profissional"
  ativo INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  cep TEXT,
  endereco TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS servicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  preco REAL NOT NULL,
  duracao_min INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  servico_id INTEGER NOT NULL REFERENCES servicos(id),
  profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
  data TEXT NOT NULL,          -- AAAA-MM-DD
  hora TEXT NOT NULL,          -- HH:MM
  duracao_min INTEGER NOT NULL,-- copiada do serviço no momento do agendamento
  valor REAL NOT NULL,         -- copiado do serviço no momento do agendamento
  status TEXT NOT NULL DEFAULT 'agendado', -- agendado | concluido | cancelado
  observacao TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Migração: bancos criados na versão 1 não tinham perfil/ativo/profissional_id
const colunas = db.prepare('PRAGMA table_info(usuarios)').all().map((c) => c.name);
if (!colunas.includes('perfil')) {
  db.exec(`ALTER TABLE usuarios ADD COLUMN perfil TEXT NOT NULL DEFAULT 'recepcao';
           ALTER TABLE usuarios ADD COLUMN profissional_id INTEGER REFERENCES profissionais(id);
           ALTER TABLE usuarios ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1;
           UPDATE usuarios SET perfil = 'admin' WHERE email = 'admin@barbearia.com';`);
}

// Dados iniciais para a demonstração (só na primeira execução)
const vazio = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n === 0;
if (vazio) {
  const p = db.prepare('INSERT INTO profissionais (nome, telefone) VALUES (?, ?)');
  const joao = p.run('João', '16999990001').lastInsertRowid;
  p.run('Marcos', '16999990002');

  const s = db.prepare('INSERT INTO servicos (nome, preco, duracao_min) VALUES (?, ?, ?)');
  s.run('Corte masculino', 40, 30);
  s.run('Barba', 30, 30);
  s.run('Corte + Barba', 65, 60);
  s.run('Pigmentação', 50, 60);

  // Senha de demonstração: 123456 (troque em produção!)
  const hash = bcrypt.hashSync('123456', 10);
  const u = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil, profissional_id) VALUES (?, ?, ?, ?, ?)');
  u.run('Administrador', 'admin@barbearia.com', hash, 'admin', null);
  u.run('Recepção', 'recepcao@barbearia.com', hash, 'recepcao', null);
  u.run('João (barbeiro)', 'joao@barbearia.com', hash, 'profissional', joao);
}

module.exports = db;
