// Camada de controle: agendamentos. Repassa o usuário logado para o service aplicar o escopo.
const service = require('../services/agendamentoService');

module.exports = {
  listar: (req, res) => res.json(service.listar(
    { data: req.query.data, status: req.query.status, profissional_id: req.query.profissional_id }, req.usuario)),
  buscar: (req, res) => res.json(service.buscar(req.params.id, req.usuario)),
  horarios: async (req, res) => res.json(await service.horariosDisponiveis(req.query)),
  criar: async (req, res) => res.status(201).json(await service.criar(req.body || {})),
  atualizar: async (req, res) => res.json(await service.atualizar(req.params.id, req.body || {})),
  status: (req, res) => res.json(service.alterarStatus(req.params.id, (req.body || {}).status, req.usuario)),
  excluir: (req, res) => { service.excluir(req.params.id); res.json({ mensagem: 'Agendamento excluído com sucesso.' }); },
};
