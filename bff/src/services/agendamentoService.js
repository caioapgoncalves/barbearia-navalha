// Camada de regras: o coração do negócio (agenda da barbearia).
const repo = require('../repositories/agendamentoRepository');
const clienteService = require('./clienteService');
const servicoService = require('./servicoService');
const profissionalService = require('./profissionalService');
const integracao = require('./integracaoService');
const v = require('../utils/validators');
const datas = require('../utils/datas');
const AppError = require('../utils/AppError');
const { ABERTURA, FECHAMENTO, INTERVALO_MIN } = require('../config/env');

const STATUS = ['agendado', 'concluido', 'cancelado'];

// Dois intervalos [inicio, fim) se sobrepõem?
const sobrepoe = (ini1, dur1, ini2, dur2) => ini1 < ini2 + dur2 && ini2 < ini1 + dur1;

// Regras de data: não pode passado, domingo nem feriado nacional (BrasilAPI)
async function validarData(data) {
  v.data(data);
  if (data < datas.hoje()) throw new AppError('Não é possível agendar em uma data passada.');
  if (datas.diaDaSemana(data) === 0) throw new AppError('A barbearia não abre aos domingos.');
  const feriado = await integracao.feriadoNaData(data);
  if (feriado) throw new AppError(`Dia ${data.split('-').reverse().join('/')} é feriado (${feriado.nome}).`);
}

// Regras de horário: dentro do expediente, em slots de 30 min, sem conflito com o profissional
function validarHorario({ data, hora, duracao, profissionalId, ignorarId }) {
  v.hora(hora);
  const inicio = v.paraMinutos(hora);
  if (inicio % INTERVALO_MIN !== 0) throw new AppError(`Escolha horários de ${INTERVALO_MIN} em ${INTERVALO_MIN} minutos.`);
  if (inicio < v.paraMinutos(ABERTURA) || inicio + duracao > v.paraMinutos(FECHAMENTO)) {
    throw new AppError(`O atendimento precisa caber no expediente (${ABERTURA} às ${FECHAMENTO}).`);
  }
  if (data === datas.hoje() && hora < datas.agoraHora()) throw new AppError('Esse horário de hoje já passou.');

  const conflito = repo.ativosDoProfissionalNoDia(profissionalId, data, ignorarId)
    .find((a) => sobrepoe(inicio, duracao, v.paraMinutos(a.hora), a.duracao_min));
  if (conflito) throw new AppError(`O profissional já tem um atendimento às ${conflito.hora} nesse período.`, 409);
}

async function montar(body, ignorarId = 0) {
  v.obrigatorio(body.cliente_id, 'cliente');
  v.obrigatorio(body.servico_id, 'serviço');
  v.obrigatorio(body.profissional_id, 'profissional');
  clienteService.buscar(body.cliente_id);
  const servico = servicoService.buscar(body.servico_id);
  profissionalService.buscar(body.profissional_id);

  await validarData(body.data);
  validarHorario({
    data: body.data, hora: body.hora, duracao: servico.duracao_min,
    profissionalId: body.profissional_id, ignorarId,
  });

  return {
    cliente_id: Number(body.cliente_id),
    servico_id: Number(body.servico_id),
    profissional_id: Number(body.profissional_id),
    data: body.data,
    hora: body.hora,
    duracao_min: servico.duracao_min, // guardamos para o histórico não mudar se o serviço mudar
    valor: servico.preco,
    observacao: v.texto(body.observacao) || null,
  };
}

// Profissional só enxerga os próprios atendimentos.
// Para os outros, respondemos 404 (nem confirmamos que o registro existe).
function buscar(id, usuario) {
  const ag = repo.buscarPorId(id);
  if (!ag || (usuario?.perfil === 'profissional' && ag.profissional_id !== usuario.profissional_id)) {
    throw new AppError('Agendamento não encontrado.', 404);
  }
  return ag;
}

// Filtros da listagem: o profissional não consegue "pedir" a agenda de outro
function filtrosPermitidos(filtros, usuario) {
  if (usuario.perfil === 'profissional') return { ...filtros, profissional_id: usuario.profissional_id || -1 };
  return filtros;
}

// Lista os horários livres de um profissional para um serviço em uma data
async function horariosDisponiveis({ data, profissional_id, servico_id, ignorar_id }) {
  await validarData(data);
  v.obrigatorio(profissional_id, 'profissional');
  v.obrigatorio(servico_id, 'serviço');
  const servico = servicoService.buscar(servico_id);
  const ocupados = repo.ativosDoProfissionalNoDia(profissional_id, data, Number(ignorar_id) || 0);
  const livres = [];
  for (let m = v.paraMinutos(ABERTURA); m + servico.duracao_min <= v.paraMinutos(FECHAMENTO); m += INTERVALO_MIN) {
    const hora = v.paraHora(m);
    if (data === datas.hoje() && hora < datas.agoraHora()) continue;
    if (ocupados.some((a) => sobrepoe(m, servico.duracao_min, v.paraMinutos(a.hora), a.duracao_min))) continue;
    livres.push(hora);
  }
  return livres;
}

module.exports = {
  listar: (filtros, usuario) => repo.listar(filtrosPermitidos(filtros, usuario)),
  buscar,
  horariosDisponiveis,
  criar: async (body) => buscar(repo.criar(await montar(body))),
  atualizar: async (id, body) => {
    const atual = buscar(id);
    if (atual.status !== 'agendado') throw new AppError('Só é possível editar agendamentos com status "agendado".');
    repo.atualizar(id, await montar(body, Number(id)));
    return buscar(id);
  },
  alterarStatus: (id, status, usuario) => {
    if (!STATUS.includes(status)) throw new AppError(`Status inválido. Use: ${STATUS.join(', ')}.`);
    const atual = buscar(id, usuario); // profissional: só o que é dele
    if (atual.status !== 'agendado') throw new AppError('Este agendamento já foi finalizado.');
    repo.atualizarStatus(id, status);
    return buscar(id);
  },
  excluir: (id) => { buscar(id); repo.excluir(id); },
};
