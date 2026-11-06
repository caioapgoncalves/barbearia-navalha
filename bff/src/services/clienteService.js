// Camada de regras: clientes.
const repo = require('../repositories/clienteRepository');
const agendamentoRepo = require('../repositories/agendamentoRepository');
const v = require('../utils/validators');
const AppError = require('../utils/AppError');

function validar(body) {
  const c = {
    nome: v.texto(body.nome),
    telefone: String(body.telefone || '').replace(/\D/g, ''),
    email: v.texto(body.email).toLowerCase() || null,
    cep: String(body.cep || '').replace(/\D/g, '') || null,
    endereco: v.texto(body.endereco) || null,
  };
  v.obrigatorio(c.nome, 'nome');
  if (c.nome.length < 3) throw new AppError('O nome deve ter pelo menos 3 letras.');
  v.telefone(c.telefone);
  v.email(c.email);
  v.cep(c.cep);
  return c;
}

function buscar(id) {
  const cliente = repo.buscarPorId(id);
  if (!cliente) throw new AppError('Cliente não encontrado.', 404);
  return cliente;
}

module.exports = {
  listar: (busca) => repo.listar(v.texto(busca)),
  buscar,
  criar: (body) => buscar(repo.criar(validar(body))),
  atualizar: (id, body) => { buscar(id); repo.atualizar(id, validar(body)); return buscar(id); },
  excluir: (id) => {
    buscar(id);
    if (agendamentoRepo.contarPorCampo('cliente_id', id) > 0) {
      throw new AppError('Este cliente possui agendamentos e não pode ser excluído.', 409);
    }
    repo.excluir(id);
  },
};
