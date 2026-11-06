// Camada de regras: serviços oferecidos pela barbearia.
const repo = require('../repositories/servicoRepository');
const agendamentoRepo = require('../repositories/agendamentoRepository');
const v = require('../utils/validators');
const AppError = require('../utils/AppError');
const { INTERVALO_MIN } = require('../config/env');

function validar(body) {
  const s = {
    nome: v.texto(body.nome),
    preco: Number(String(body.preco ?? '').replace(',', '.')),
    duracao_min: Number(body.duracao_min),
  };
  v.obrigatorio(s.nome, 'nome');
  v.numeroPositivo(s.preco, 'preço');
  v.numeroPositivo(s.duracao_min, 'duração');
  if (s.duracao_min % INTERVALO_MIN !== 0) {
    throw new AppError(`A duração deve ser múltipla de ${INTERVALO_MIN} minutos (30, 60, 90...).`);
  }
  return s;
}

function buscar(id) {
  const servico = repo.buscarPorId(id);
  if (!servico) throw new AppError('Serviço não encontrado.', 404);
  return servico;
}

module.exports = {
  listar: () => repo.listar(),
  buscar,
  criar: (body) => buscar(repo.criar(validar(body))),
  atualizar: (id, body) => { buscar(id); repo.atualizar(id, validar(body)); return buscar(id); },
  excluir: (id) => {
    buscar(id);
    if (agendamentoRepo.contarPorCampo('servico_id', id) > 0) {
      throw new AppError('Este serviço já foi usado em agendamentos e não pode ser excluído.', 409);
    }
    repo.excluir(id);
  },
};
