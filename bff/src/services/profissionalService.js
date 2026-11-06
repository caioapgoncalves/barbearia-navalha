// Camada de regras: profissionais.
const repo = require('../repositories/profissionalRepository');
const agendamentoRepo = require('../repositories/agendamentoRepository');
const usuarioRepo = require('../repositories/usuarioRepository');
const v = require('../utils/validators');
const AppError = require('../utils/AppError');

function validar(body) {
  const p = {
    nome: v.texto(body.nome),
    telefone: String(body.telefone || '').replace(/\D/g, '') || null,
  };
  v.obrigatorio(p.nome, 'nome');
  if (p.telefone) v.telefone(p.telefone);
  return p;
}

function buscar(id) {
  const prof = repo.buscarPorId(id);
  if (!prof) throw new AppError('Profissional não encontrado.', 404);
  return prof;
}

module.exports = {
  listar: () => repo.listar(),
  buscar,
  criar: (body) => buscar(repo.criar(validar(body))),
  atualizar: (id, body) => { buscar(id); repo.atualizar(id, validar(body)); return buscar(id); },
  excluir: (id) => {
    buscar(id);
    if (agendamentoRepo.contarPorCampo('profissional_id', id) > 0) {
      throw new AppError('Este profissional possui agendamentos e não pode ser excluído.', 409);
    }
    if (usuarioRepo.contarPorProfissional(id) > 0) {
      throw new AppError('Existe um usuário ligado a este profissional. Remova o usuário antes.', 409);
    }
    repo.excluir(id);
  },
};
