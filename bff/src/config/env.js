// Camada de configuração: centraliza variáveis de ambiente.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Segurança: o JWT nunca usa um segredo fixo do código.
// Se não existir JWT_SECRET no .env, geramos um aleatório e salvamos no .env.
if (!process.env.JWT_SECRET) {
  const segredo = crypto.randomBytes(48).toString('hex');
  fs.appendFileSync(path.resolve(__dirname, '..', '..', '.env'), `\nJWT_SECRET=${segredo}\n`);
  process.env.JWT_SECRET = segredo;
  console.log('JWT_SECRET gerado e salvo no arquivo .env');
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  DB_FILE: process.env.DB_FILE || 'barbearia.db',
  // CORS: só estes endereços (navegador) podem chamar o BFF. App nativo não envia Origin.
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006')
    .split(',').map((o) => o.trim()).filter(Boolean),
  // Regras do negócio (horário de funcionamento da barbearia)
  ABERTURA: process.env.ABERTURA || '08:00',
  FECHAMENTO: process.env.FECHAMENTO || '20:00',
  INTERVALO_MIN: 30, // slots de 30 minutos
};
