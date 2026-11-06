// Camada de controle: recebe a requisição HTTP, chama o service e devolve a resposta.
// Fábrica reutilizada por clientes, serviços e profissionais (mesmo formato de CRUD).
module.exports = function crudController(service, nome) {
  return {
    listar: (req, res) => res.json(service.listar(req.query.busca)),
    buscar: (req, res) => res.json(service.buscar(req.params.id)),
    criar: (req, res) => res.status(201).json(service.criar(req.body)),
    atualizar: (req, res) => res.json(service.atualizar(req.params.id, req.body)),
    excluir: (req, res) => { service.excluir(req.params.id); res.json({ mensagem: `${nome} excluído com sucesso.` }); },
  };
};
