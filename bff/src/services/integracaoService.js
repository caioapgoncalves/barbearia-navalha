// Camada de integração: conversa com as APIs externas (ViaCEP e BrasilAPI).
const axios = require('axios');
const AppError = require('../utils/AppError');

const http = axios.create({ timeout: 8000 });
const cacheFeriados = {}; // { 2026: [{date, name}] } — evita chamar a BrasilAPI toda hora

async function buscarCep(cep) {
  const digitos = String(cep || '').replace(/\D/g, '');
  if (digitos.length !== 8) throw new AppError('CEP deve ter 8 dígitos.');
  try {
    const { data } = await http.get(`https://viacep.com.br/ws/${digitos}/json/`);
    if (data.erro) throw new AppError('CEP não encontrado.', 404);
    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('Não foi possível consultar o CEP agora (ViaCEP indisponível).', 502);
  }
}

async function listarFeriados(ano) {
  if (cacheFeriados[ano]) return cacheFeriados[ano];
  try {
    const { data } = await http.get(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
    cacheFeriados[ano] = data.map((f) => ({ data: f.date, nome: f.name }));
    return cacheFeriados[ano];
  } catch {
    throw new AppError('Não foi possível consultar os feriados agora (BrasilAPI indisponível).', 502);
  }
}

// Retorna o feriado da data ou null. Se a BrasilAPI cair, não bloqueia o agendamento.
async function feriadoNaData(data) {
  try {
    const feriados = await listarFeriados(data.slice(0, 4));
    return feriados.find((f) => f.data === data) || null;
  } catch {
    console.warn('BrasilAPI indisponível: agendamento seguirá sem checar feriado.');
    return null;
  }
}

module.exports = { buscarCep, listarFeriados, feriadoNaData };
