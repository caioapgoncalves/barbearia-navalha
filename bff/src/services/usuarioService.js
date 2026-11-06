// Camada de regras: gestão de usuários (somente admin chega aqui).
const bcrypt = require('bcryptjs');
const repo = require('../repositories/usuarioRepository');
const profissionalService = require('./profissionalService');
const v = require('../utils/validators');
const AppError = require('../utils/AppError');
const { PERFIS } = require('../config/permissoes');

function validar(body, { novo }) {
  const u = {
    nome: v.texto(body.nome),
    email: v.texto(body.email).toLowerCase(),
    perfil: body.perfil,
    profissional_id: body.perfil === 'profissional' ? Number(body.profissional_id) || null : null,
    ativo: body.ativo === false || body.ativo === 0 ? 0 : 1,
  };
  v.obrigatorio(u.nome, 'nome');
  v.obrigatorio(u.email, 'e-mail');
  v.email(u.email);
  if (!PERFIS.includes(u.perfil)) throw new AppError(`Perfil inválido. Use: ${PERFIS.join(', ')}.`);
  if (u.perfil === 'profissional') {
    if (!u.profissional_id) throw new AppError('Usuário do perfil profissional precisa estar ligado a um profissional.');
    profissionalService.buscar(u.profissional_id);
  }
  if (novo || body.senha) {
    if (String(body.senha || '').length < 6) throw new AppError('A senha deve ter pelo menos 6 caracteres.');
  }
  return u;
}

function buscar(id) {
  const u = repo.buscarPorId(id);
  if (!u) throw new AppError('Usuário não encontrado.', 404);
  return u;
}

function garantirEmailUnico(email, id = 0) {
  const existente = repo.buscarPorEmail(email);
  if (existente && existente.id !== Number(id)) throw new AppError('Já existe um usuário com este e-mail.', 409);
}

module.exports = {
  listar: () => repo.listar(),
  buscar,
  criar: (body) => {
    const u = validar(body, { novo: true });
    garantirEmailUnico(u.email);
    return buscar(repo.criar({ ...u, senha_hash: bcrypt.hashSync(String(body.senha), 10) }));
  },
  atualizar: (id, body, logado) => {
    const atual = buscar(id);
    const u = validar(body, { novo: false });
    garantirEmailUnico(u.email, id);
    // Proteções: o admin não pode se trancar fora do sistema
    if (Number(id) === logado.id && (u.perfil !== 'admin' || !u.ativo)) {
      throw new AppError('Você não pode remover o seu próprio acesso de administrador.');
    }
    if (atual.perfil === 'admin' && atual.ativo && (u.perfil !== 'admin' || !u.ativo) && repo.contarAdminsAtivos() <= 1) {
      throw new AppError('É preciso manter pelo menos um administrador ativo.');
    }
    repo.atualizar(id, u);
    if (body.senha) repo.atualizarSenha(id, bcrypt.hashSync(String(body.senha), 10));
    return buscar(id);
  },
  excluir: (id, logado) => {
    const atual = buscar(id);
    if (Number(id) === logado.id) throw new AppError('Você não pode excluir o seu próprio usuário.');
    if (atual.perfil === 'admin' && repo.contarAdminsAtivos() <= 1) {
      throw new AppError('É preciso manter pelo menos um administrador ativo.');
    }
    repo.excluir(id);
  },
};
