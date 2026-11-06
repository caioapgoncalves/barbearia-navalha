// Camada de controle: o app chama as APIs externas sempre passando pelo BFF.
const integracao = require('../services/integracaoService');

module.exports = {
  cep: async (req, res) => res.json(await integracao.buscarCep(req.params.cep)),
  feriados: async (req, res) => res.json(await integracao.listarFeriados(req.params.ano)),
};
