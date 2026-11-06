// Middleware: transforma qualquer erro em uma resposta JSON com mensagem clara.
const AppError = require('../utils/AppError');

module.exports = function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.status).json({ mensagem: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensagem: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ mensagem: 'Erro interno no servidor. Tente novamente.' });
};
