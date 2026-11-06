// Middlewares de segurança:
//  autenticar -> confere o token JWT e carrega o usuário ATUAL do banco
//  autorizar  -> confere se o perfil do usuário tem a permissão pedida
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { pode } = require('../config/permissoes');
const usuarioRepo = require('../repositories/usuarioRepository');
const AppError = require('../utils/AppError');

function autenticar(req, _res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new AppError('Faça login para continuar.', 401));

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new AppError('Sessão expirada. Faça login novamente.', 401));
  }

  // Buscamos o usuário no banco a cada requisição: se o admin desativar
  // alguém ou trocar o perfil, a mudança vale na hora (não espera o token expirar).
  const usuario = usuarioRepo.buscarPorId(payload.id);
  if (!usuario || !usuario.ativo) return next(new AppError('Usuário sem acesso. Fale com o administrador.', 401));
  req.usuario = usuario; // { id, nome, email, perfil, profissional_id, ativo }
  next();
}

// Uso: router.get('/clientes', autorizar('clientes:ver'), controller.listar)
const autorizar = (permissao) => (req, _res, next) => {
  if (!pode(req.usuario?.perfil, permissao)) {
    return next(new AppError('Você não tem permissão para esta ação.', 403));
  }
  next();
};

module.exports = { autenticar, autorizar };
