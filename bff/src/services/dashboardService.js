// Camada de regras: indicadores do negócio. O conteúdo depende do perfil:
//  admin        -> tudo, inclusive faturamento
//  recepcao     -> indicadores operacionais (sem valores em R$)
//  profissional -> somente os próprios atendimentos
const repo = require('../repositories/agendamentoRepository');
const datas = require('../utils/datas');
const { pode } = require('../config/permissoes');

function ultimos7Dias() {
  const dias = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dias.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dias;
}

module.exports = {
  obter(usuario) {
    const hoje = datas.hoje();
    const escopo = usuario.perfil === 'profissional' ? usuario.profissional_id || -1 : 0;
    const dia = repo.resumoDoDia(hoje, escopo);
    const resposta = {
      perfil: usuario.perfil,
      hoje: {
        data: hoje,
        total: dia.total || 0,
        pendentes: dia.pendentes || 0,
        concluidos: dia.concluidos || 0,
        cancelados: dia.cancelados || 0,
      },
      proximos: repo.proximos(hoje, datas.agoraHora(), escopo),
    };

    if (usuario.perfil !== 'profissional') {
      const mes = datas.mesAtual();
      resposta.servicoMaisVendido = repo.servicoMaisVendido(mes.inicio, mes.fim) || null;
      resposta.horarioMaisCheio = repo.horarioMaisCheio(mes.inicio, mes.fim) || null;
    }

    // Dados financeiros: SOMENTE quem tem a permissão recebe estes campos
    if (pode(usuario.perfil, 'dashboard:financeiro')) {
      const semana = datas.semanaAtual();
      const mes = datas.mesAtual();
      const dias = ultimos7Dias();
      const porDia = repo.faturamentoPorDia(dias[0], dias[6]);
      resposta.financeiro = {
        hoje: repo.faturamentoEntre(hoje, hoje),
        semana: repo.faturamentoEntre(semana.inicio, semana.fim),
        mes: repo.faturamentoEntre(mes.inicio, mes.fim),
        ultimos7Dias: dias.map((d) => ({ data: d, total: porDia.find((p) => p.data === d)?.total || 0 })),
      };
    }
    return resposta;
  },
};
