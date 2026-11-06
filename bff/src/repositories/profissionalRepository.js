// Camada de acesso a dados: profissionais (barbeiros).
const db = require('../database/connection');

module.exports = {
  listar: () => db.prepare('SELECT * FROM profissionais ORDER BY nome').all(),
  buscarPorId: (id) => db.prepare('SELECT * FROM profissionais WHERE id = ?').get(id),
  criar: (p) =>
    db.prepare('INSERT INTO profissionais (nome, telefone) VALUES (?, ?)').run(p.nome, p.telefone).lastInsertRowid,
  atualizar: (id, p) =>
    db.prepare('UPDATE profissionais SET nome = ?, telefone = ? WHERE id = ?').run(p.nome, p.telefone, id),
  excluir: (id) => db.prepare('DELETE FROM profissionais WHERE id = ?').run(id),
};
