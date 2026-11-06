// Camada de acesso a dados: serviços (corte, barba...).
const db = require('../database/connection');

module.exports = {
  listar: () => db.prepare('SELECT * FROM servicos ORDER BY nome').all(),
  buscarPorId: (id) => db.prepare('SELECT * FROM servicos WHERE id = ?').get(id),
  criar: (s) =>
    db.prepare('INSERT INTO servicos (nome, preco, duracao_min) VALUES (?, ?, ?)')
      .run(s.nome, s.preco, s.duracao_min).lastInsertRowid,
  atualizar: (id, s) =>
    db.prepare('UPDATE servicos SET nome = ?, preco = ?, duracao_min = ? WHERE id = ?')
      .run(s.nome, s.preco, s.duracao_min, id),
  excluir: (id) => db.prepare('DELETE FROM servicos WHERE id = ?').run(id),
};
