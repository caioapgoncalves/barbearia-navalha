// Camada de regras: autenticação.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../repositories/usuarioRepository');
const v = require('../utils/validators');
const AppError = require('../utils/AppError');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { PERMISSOES, pode } = require('../config/permissoes');

// Lista das permissões do perfil: o app usa para esconder botões/telas.
// (Esconder no app é só conforto visual — quem garante a segurança é o BFF.)
const permissoesDo = (perfil) => Object.keys(PERMISSOES).filter((p) => pode(perfil, p));

async function login({ email, senha }) {
  v.obrigatorio(email, 'e-mail');
  v.obrigatorio(senha, 'senha');
  const registro = repo.buscarParaLogin(v.texto(email).toLowerCase());
  // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem
  if (!registro || !bcrypt.compareSync(String(senha), registro.senha_hash)) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }
  if (!registro.ativo) throw new AppError('Usuário desativado. Fale com o administrador.', 403);

  // No token vai só o id: perfil e permissões são relidos do banco a cada requisição
  const token = jwt.sign({ id: registro.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const usuario = repo.buscarPorId(registro.id);
  return { token, usuario: { ...usuario, permissoes: permissoesDo(usuario.perfil) } };
}

const perfil = (usuario) => ({ ...usuario, permissoes: permissoesDo(usuario.perfil) });

module.exports = { login, perfil };
