// Camada de acesso a dados: agendamentos e consultas do dashboard.
const db = require('../database/connection');

// SELECT com os nomes já "juntados" para o app não precisar fazer várias chamadas.
const SELECT_COMPLETO = `
  SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
         s.nome AS servico_nome, p.nome AS profissional_nome
  FROM agendamentos a
  JOIN clientes c ON c.id = a.cliente_id
  JOIN servicos s ON s.id = a.servico_id
  JOIN profissionais p ON p.id = a.profissional_id`;

module.exports = {
  listar: ({ data, status, profissional_id }) => {
    const filtros = [];
    const params = [];
    if (data) { filtros.push('a.data = ?'); params.push(data); }
    if (status) { filtros.push('a.status = ?'); params.push(status); }
    if (profissional_id) { filtros.push('a.profissional_id = ?'); params.push(Number(profissional_id)); }
    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    return db.prepare(`${SELECT_COMPLETO} ${where} ORDER BY a.data, a.hora`).all(...params);
  },
  buscarPorId: (id) => db.prepare(`${SELECT_COMPLETO} WHERE a.id = ?`).get(id),

  // Agendamentos ativos do profissional no dia (para checar conflito de horário)
  ativosDoProfissionalNoDia: (profissionalId, data, ignorarId = 0) =>
    db.prepare(`SELECT id, hora, duracao_min FROM agendamentos
                WHERE profissional_id = ? AND data = ? AND status != 'cancelado' AND id != ?`)
      .all(profissionalId, data, ignorarId),

  contarPorCampo: (campo, id) => {
    // Lista fechada de colunas: nunca montamos SQL com texto vindo do usuário
    if (!['cliente_id', 'servico_id', 'profissional_id'].includes(campo)) throw new Error('Campo inválido');
    return db.prepare(`SELECT COUNT(*) AS n FROM agendamentos WHERE ${campo} = ?`).get(id).n;
  },

  criar: (a) =>
    db.prepare(`INSERT INTO agendamentos
      (cliente_id, servico_id, profissional_id, data, hora, duracao_min, valor, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(a.cliente_id, a.servico_id, a.profissional_id, a.data, a.hora, a.duracao_min, a.valor, a.observacao)
      .lastInsertRowid,
  atualizar: (id, a) =>
    db.prepare(`UPDATE agendamentos SET cliente_id = ?, servico_id = ?, profissional_id = ?,
      data = ?, hora = ?, duracao_min = ?, valor = ?, observacao = ? WHERE id = ?`)
      .run(a.cliente_id, a.servico_id, a.profissional_id, a.data, a.hora, a.duracao_min, a.valor, a.observacao, id),
  atualizarStatus: (id, status) => db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run(status, id),
  excluir: (id) => db.prepare('DELETE FROM agendamentos WHERE id = ?').run(id),

  // ---- Consultas do dashboard ----
  // profissionalId = 0 significa "todos os profissionais"
  resumoDoDia: (data, profissionalId = 0) => db.prepare(`
    SELECT COUNT(*) AS total,
           SUM(status = 'agendado') AS pendentes,
           SUM(status = 'concluido') AS concluidos,
           SUM(status = 'cancelado') AS cancelados
    FROM agendamentos WHERE data = ? AND (? = 0 OR profissional_id = ?)`).get(data, profissionalId, profissionalId),
  faturamentoPorDia: (inicio, fim) => db.prepare(`
    SELECT data, SUM(valor) AS total FROM agendamentos
    WHERE status = 'concluido' AND data BETWEEN ? AND ? GROUP BY data`).all(inicio, fim),
  faturamentoEntre: (inicio, fim) => db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS total FROM agendamentos
    WHERE status = 'concluido' AND data BETWEEN ? AND ?`).get(inicio, fim).total,
  servicoMaisVendido: (inicio, fim) => db.prepare(`
    SELECT s.nome, COUNT(*) AS quantidade FROM agendamentos a JOIN servicos s ON s.id = a.servico_id
    WHERE a.status != 'cancelado' AND a.data BETWEEN ? AND ?
    GROUP BY s.id ORDER BY quantidade DESC LIMIT 1`).get(inicio, fim),
  horarioMaisCheio: (inicio, fim) => db.prepare(`
    SELECT hora, COUNT(*) AS quantidade FROM agendamentos
    WHERE status != 'cancelado' AND data BETWEEN ? AND ?
    GROUP BY hora ORDER BY quantidade DESC LIMIT 1`).get(inicio, fim),
  proximos: (data, hora, profissionalId = 0, limite = 5) => db.prepare(`${SELECT_COMPLETO}
    WHERE a.status = 'agendado' AND (a.data > ? OR (a.data = ? AND a.hora >= ?))
      AND (? = 0 OR a.profissional_id = ?)
    ORDER BY a.data, a.hora LIMIT ?`).all(data, data, hora, profissionalId, profissionalId, limite),
};
