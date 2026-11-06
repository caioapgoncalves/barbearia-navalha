// Camada de acesso a dados: clientes.
const db = require('../database/connection');

module.exports = {
  listar: (busca = '') =>
    db.prepare('SELECT * FROM clientes WHERE nome LIKE ? OR telefone LIKE ? ORDER BY nome')
      .all(`%${busca}%`, `%${busca}%`),
  buscarPorId: (id) => db.prepare('SELECT * FROM clientes WHERE id = ?').get(id),
  criar: (c) =>
    db.prepare('INSERT INTO clientes (nome, telefone, email, cep, endereco) VALUES (?, ?, ?, ?, ?)')
      .run(c.nome, c.telefone, c.email, c.cep, c.endereco).lastInsertRowid,
  atualizar: (id, c) =>
    db.prepare('UPDATE clientes SET nome = ?, telefone = ?, email = ?, cep = ?, endereco = ? WHERE id = ?')
      .run(c.nome, c.telefone, c.email, c.cep, c.endereco, id),
  excluir: (id) => db.prepare('DELETE FROM clientes WHERE id = ?').run(id),
};
