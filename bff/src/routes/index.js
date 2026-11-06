// Camada de rotas: liga cada URL ao controller e diz QUAL permissão é exigida.
// Nenhuma rota fica aberta para "qualquer usuário logado" sem uma permissão explícita.
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { autenticar, autorizar } = require('../middlewares/auth');
const crud = require('../controllers/crudController');
const auth = require('../controllers/authController');
const agendamento = require('../controllers/agendamentoController');
const dashboard = require('../controllers/dashboardController');
const integracao = require('../controllers/integracaoController');
const usuario = require('../controllers/usuarioController');

const router = Router();

// Força bruta: no máximo 10 tentativas de login a cada 15 minutos por IP
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // só conta tentativas que falharam
  message: { mensagem: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

// Registra as 5 rotas de CRUD com permissão de leitura e de escrita separadas
function rotasCrud(caminho, controller, { ver, editar, excluir = editar }) {
  router.get(caminho, autorizar(ver), controller.listar);
  router.get(`${caminho}/:id`, autorizar(ver), controller.buscar);
  router.post(caminho, autorizar(editar), controller.criar);
  router.put(`${caminho}/:id`, autorizar(editar), controller.atualizar);
  router.delete(`${caminho}/:id`, autorizar(excluir), controller.excluir);
}

// ---------- Rotas públicas ----------
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.post('/auth/login', limiteLogin, auth.login);

// ---------- Daqui pra baixo: precisa de token válido ----------
router.use(autenticar);
router.get('/auth/me', auth.perfil);
router.get('/dashboard', autorizar('dashboard:ver'), dashboard.obter);

rotasCrud('/clientes', crud(require('../services/clienteService'), 'Cliente'),
  { ver: 'clientes:ver', editar: 'clientes:editar', excluir: 'clientes:excluir' });
rotasCrud('/servicos', crud(require('../services/servicoService'), 'Serviço'),
  { ver: 'servicos:ver', editar: 'servicos:editar' });
rotasCrud('/profissionais', crud(require('../services/profissionalService'), 'Profissional'),
  { ver: 'profissionais:ver', editar: 'profissionais:editar' });

router.get('/agendamentos/horarios-disponiveis', autorizar('agendamentos:criar'), agendamento.horarios);
router.get('/agendamentos', autorizar('agendamentos:ver'), agendamento.listar);
router.get('/agendamentos/:id', autorizar('agendamentos:ver'), agendamento.buscar);
router.post('/agendamentos', autorizar('agendamentos:criar'), agendamento.criar);
router.put('/agendamentos/:id', autorizar('agendamentos:editar'), agendamento.atualizar);
router.patch('/agendamentos/:id/status', autorizar('agendamentos:status'), agendamento.status);
router.delete('/agendamentos/:id', autorizar('agendamentos:excluir'), agendamento.excluir);

rotasCrud('/usuarios', usuario, { ver: 'usuarios:gerenciar', editar: 'usuarios:gerenciar' });

router.get('/integracoes/cep/:cep', autorizar('integracoes:usar'), integracao.cep);
router.get('/integracoes/feriados/:ano', autorizar('integracoes:usar'), integracao.feriados);

module.exports = router;
