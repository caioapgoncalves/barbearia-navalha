// Camada de acesso a dados: usuários. A senha (hash) só sai daqui no login.
const db = require('../database/connection');

const CAMPOS_PUBLICOS = `u.id, u.nome, u.email, u.perfil, u.profissional_id, u.ativo, p.nome AS profissional_nome`;
const FROM = 'FROM usuarios u LEFT JOIN profissionais p ON p.id = u.profissional_id';

module.exports = {
  buscarParaLogin: (email) => db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email),
  buscarPorId: (id) => db.prepare(`SELECT ${CAMPOS_PUBLICOS} ${FROM} WHERE u.id = ?`).get(id),
  buscarPorEmail: (email) => db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email),
  listar: () => db.prepare(`SELECT ${CAMPOS_PUBLICOS} ${FROM} ORDER BY u.nome`).all(),
  contarAdminsAtivos: () => db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE perfil = 'admin' AND ativo = 1").get().n,
  contarPorProfissional: (profissionalId) =>
    db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE profissional_id = ?').get(profissionalId).n,
  criar: (u) =>
    db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil, profissional_id, ativo) VALUES (?, ?, ?, ?, ?, ?)')
      .run(u.nome, u.email, u.senha_hash, u.perfil, u.profissional_id, u.ativo).lastInsertRowid,
  atualizar: (id, u) =>
    db.prepare('UPDATE usuarios SET nome = ?, email = ?, perfil = ?, profissional_id = ?, ativo = ? WHERE id = ?')
      .run(u.nome, u.email, u.perfil, u.profissional_id, u.ativo, id),
  atualizarSenha: (id, hash) => db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(hash, id),
  excluir: (id) => db.prepare('DELETE FROM usuarios WHERE id = ?').run(id),
};
