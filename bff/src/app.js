// Monta a aplicação Express: segurança, rotas e tratamento de erros.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { CORS_ORIGINS } = require('./config/env');

const app = express();
app.disable('x-powered-by');
app.use(helmet()); // cabeçalhos HTTP de segurança

// CORS restrito: no lugar de liberar "*" (qualquer site), só as origens do .env.
// Requisições sem Origin (app nativo no celular, curl, Postman) continuam funcionando.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true);
    callback(null, false);
  },
}));

app.use(express.json({ limit: '100kb' })); // evita payloads gigantes
app.use(routes);
app.use((_req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));
app.use(errorHandler);

module.exports = app;
