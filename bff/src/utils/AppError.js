// Erro de negócio com status HTTP e mensagem amigável para o app.
class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = AppError;
