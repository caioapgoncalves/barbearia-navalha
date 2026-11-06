// Ponto de entrada: sobe o servidor e mostra os IPs para configurar no celular.
const os = require('os');
const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF Barbearia rodando na porta ${PORT}`);
  Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .forEach((i) => console.log(`  -> http://${i.address}:${PORT}`));
});
