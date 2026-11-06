// Camada de controle: autenticação.
const authService = require('../services/authService');

module.exports = {
  login: async (req, res) => res.json(await authService.login(req.body || {})),
  perfil: (req, res) => res.json(authService.perfil(req.usuario)),
};
