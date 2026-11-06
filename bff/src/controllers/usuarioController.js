// Camada de controle: usuários (rota protegida por 'usuarios:gerenciar').
const service = require('../services/usuarioService');

module.exports = {
  listar: (_req, res) => res.json(service.listar()),
  buscar: (req, res) => res.json(service.buscar(req.params.id)),
  criar: (req, res) => res.status(201).json(service.criar(req.body || {})),
  atualizar: (req, res) => res.json(service.atualizar(req.params.id, req.body || {}, req.usuario)),
  excluir: (req, res) => { service.excluir(req.params.id, req.usuario); res.json({ mensagem: 'Usuário excluído com sucesso.' }); },
};
