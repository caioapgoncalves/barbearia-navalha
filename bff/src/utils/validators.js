// Funções de validação reutilizadas pelos services.
const AppError = require('./AppError');

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

function obrigatorio(valor, campo) {
  if (valor === undefined || valor === null || texto(String(valor)) === '') {
    throw new AppError(`O campo "${campo}" é obrigatório.`);
  }
}

function email(valor) {
  if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) throw new AppError('E-mail inválido.');
}

function telefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 11) throw new AppError('Telefone deve ter DDD + número (10 ou 11 dígitos).');
}

function cep(valor) {
  if (valor && !/^\d{8}$/.test(String(valor).replace(/\D/g, ''))) throw new AppError('CEP deve ter 8 dígitos.');
}

function numeroPositivo(valor, campo) {
  if (!(Number(valor) > 0)) throw new AppError(`O campo "${campo}" deve ser um número maior que zero.`);
}

function data(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || '')) throw new AppError('Data deve estar no formato AAAA-MM-DD.');
  const [a, m, d] = valor.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== m - 1 || dt.getDate() !== d) throw new AppError('Data inválida.');
}

function hora(valor) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(valor || '')) throw new AppError('Horário deve estar no formato HH:MM.');
}

// "14:30" -> 870
const paraMinutos = (h) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
// 870 -> "14:30"
const paraHora = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

module.exports = { texto, obrigatorio, email, telefone, cep, numeroPositivo, data, hora, paraMinutos, paraHora };
