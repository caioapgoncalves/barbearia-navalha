// Camada de controle: dashboard.
const service = require('../services/dashboardService');

module.exports = { obter: (req, res) => res.json(service.obter(req.usuario)) };
