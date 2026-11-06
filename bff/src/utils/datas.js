// Datas no horário local do servidor (formato AAAA-MM-DD / HH:MM).
const pad = (n) => String(n).padStart(2, '0');
const formatar = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const hoje = () => formatar(new Date());
const agoraHora = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// Segunda-feira e domingo da semana atual
function semanaAtual() {
  const d = new Date();
  const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diaSemana);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
  return { inicio: formatar(inicio), fim: formatar(fim) };
}

function mesAtual() {
  const d = new Date();
  return { inicio: formatar(new Date(d.getFullYear(), d.getMonth(), 1)), fim: formatar(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}

const diaDaSemana = (data) => { const [a, m, d] = data.split('-').map(Number); return new Date(a, m - 1, d).getDay(); };

module.exports = { hoje, agoraHora, semanaAtual, mesAtual, diaDaSemana };
