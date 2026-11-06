// Matriz de permissões: QUEM pode fazer O QUÊ.
// Nada é liberado para "todos" (*): cada ação lista explicitamente os perfis permitidos.
//
//  admin        -> dono da barbearia: tudo, inclusive faturamento e usuários
//  recepcao     -> atendente: agenda e clientes, sem dados financeiros e sem excluir histórico
//  profissional -> barbeiro: vê e conclui SOMENTE os próprios atendimentos

const PERFIS = ['admin', 'recepcao', 'profissional'];

const PERMISSOES = {
  'dashboard:ver':           ['admin', 'recepcao', 'profissional'], // o conteúdo muda por perfil
  'dashboard:financeiro':    ['admin'],

  'clientes:ver':            ['admin', 'recepcao'],
  'clientes:editar':         ['admin', 'recepcao'],
  'clientes:excluir':        ['admin'],

  'servicos:ver':            ['admin', 'recepcao'],
  'servicos:editar':         ['admin'],

  'profissionais:ver':       ['admin', 'recepcao'],
  'profissionais:editar':    ['admin'],

  'agendamentos:ver':        ['admin', 'recepcao', 'profissional'], // profissional: só os dele
  'agendamentos:criar':      ['admin', 'recepcao'],
  'agendamentos:editar':     ['admin', 'recepcao'],
  'agendamentos:status':     ['admin', 'recepcao', 'profissional'], // profissional: só os dele
  'agendamentos:excluir':    ['admin'],

  'usuarios:gerenciar':      ['admin'],
  'integracoes:usar':        ['admin', 'recepcao'],
};

const pode = (perfil, permissao) => (PERMISSOES[permissao] || []).includes(perfil);

module.exports = { PERFIS, PERMISSOES, pode };
