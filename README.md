# Navalha — Agenda para barbearias (App mobile + BFF)

Aplicação mobile em **React Native (Expo SDK 54)** para uma barbearia gerenciar clientes, serviços, profissionais e a agenda de atendimentos. O app conversa **somente** com um **BFF (Node + Express)**, que aplica as regras de negócio, salva tudo em um banco **SQLite** e chama as APIs externas.

## Problema de negócio

Barbearias pequenas controlam a agenda no caderno ou no WhatsApp. O resultado são horários marcados em dobro, clientes agendados em feriados e nenhuma visão de faturamento.

- **Público:** dono/atendente da barbearia.
- **Benefícios:** fim dos conflitos de horário (o sistema só oferece horários livres), bloqueio automático de domingos e feriados, confirmação rápida pelo WhatsApp e indicadores de faturamento e demanda.

## Arquitetura

```
 App (Expo)  ──HTTP/JSON + JWT──►  BFF (Express)  ──►  SQLite (barbearia.db)
                                        │
                                        ├──► ViaCEP     (endereço pelo CEP)
                                        └──► BrasilAPI  (feriados nacionais)
 App ──► WhatsApp (wa.me) para confirmar o horário com o cliente
```

### Camadas do BFF (`bff/src`)

| Pasta | Responsabilidade |
|---|---|
| `routes/` | Liga cada URL ao controller. Rotas abaixo de `autenticar` exigem token. |
| `controllers/` | Recebe a requisição HTTP e devolve a resposta. Não tem regra de negócio. |
| `services/` | **Regras de negócio**: validações, conflito de horário, feriados, dashboard. |
| `repositories/` | Único lugar com SQL. Lê e grava no banco. |
| `database/` | Conexão SQLite, criação das tabelas e dados iniciais. |
| `middlewares/` | `autenticar` (JWT + usuário atual do banco), `autorizar` (permissão por perfil) e erros. |
| `utils/` | Validadores, datas e a classe `AppError`. |
| `config/` | Variáveis de ambiente e a **matriz de permissões** (`permissoes.js`). |

Fluxo: `rota → controller → service → repository → banco`

### Camadas do app (`app/src`)

Mesma organização dos projetos da aula (`rv_clientes25092026` e `agendamento_didatico`):

| Pasta | Responsabilidade |
|---|---|
| `navigation/` | `RootNavigator` escolhe login ou app; `TabNavigator` (abas por perfil); `AppNavigator` (telas por permissão). |
| `contexts/` | `AuthContext`: login, logout, token no AsyncStorage e `pode('permissao')`. |
| `screens/` | Telas (estado e interação). Uma pasta por módulo. |
| `components/` | Design system (`ui.js`), `WeekStrip`, `SearchPicker`, `MiniBarChart`, `ListaScreen`. |
| `services/` | Acesso ao BFF com Axios. As telas não sabem se é GET, POST, PUT ou DELETE. |
| `hooks/` | `useCarregar`: busca dados sempre que a tela ganha foco. |
| `utils/` | Validações, formatação (moeda, data, telefone) e confirmações. |
| `config/` | Descobre automaticamente o IP do BFF. |
| `theme/` | Design tokens: cores, espaçamentos, raios, tipografia. |

## Perfis e segurança

Nenhuma rota fica liberada para "qualquer usuário logado" (`*`). Cada rota exige uma permissão explícita, definida em `bff/src/config/permissoes.js`:

| Permissão | Admin | Recepção | Profissional |
|---|:-:|:-:|:-:|
| Dashboard (operacional) | ✅ | ✅ | ✅ só o dele |
| Faturamento (R$) | ✅ | ❌ | ❌ |
| Ver / editar clientes | ✅ | ✅ | ❌ |
| Excluir clientes | ✅ | ❌ | ❌ |
| Ver serviços e profissionais | ✅ | ✅ | ❌ |
| Editar serviços e profissionais | ✅ | ❌ | ❌ |
| Ver agendamentos | ✅ | ✅ | ✅ só os dele |
| Criar / editar agendamentos | ✅ | ✅ | ❌ |
| Concluir / cancelar | ✅ | ✅ | ✅ só os dele |
| Excluir agendamento | ✅ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ |

Outras proteções:
- **403** quando falta permissão. **404** quando um profissional tenta abrir o atendimento de outro, para não revelar que o registro existe.
- O usuário é relido do banco a cada requisição: desativar alguém ou trocar o perfil vale na hora.
- O token JWT leva só o `id`. O segredo é gerado aleatoriamente no `.env`, nunca fica fixo no código.
- Senhas com bcrypt. O hash nunca é devolvido pela API.
- Login: mesma mensagem para e-mail inexistente e senha errada, e limite de 10 tentativas falhas a cada 15 min por IP.
- **CORS restrito** às origens do `.env` (antes era `*`), mais `helmet` (cabeçalhos de segurança) e limite de 100 kb no corpo das requisições.
- O admin não consegue remover o próprio acesso, e o sistema sempre mantém pelo menos 1 admin ativo.
- O app **esconde** abas e botões conforme o perfil, mas isso é só conforto visual: quem **garante** a segurança é o BFF.

## Regras de negócio (no BFF)

1. Não é possível agendar em data passada, em domingos ou em **feriados nacionais** (consultados na BrasilAPI).
2. Os atendimentos precisam caber no expediente (08:00–20:00) e começam em slots de 30 minutos.
3. **Sem conflito:** um profissional não pode ter dois atendimentos sobrepostos. A duração do serviço é considerada (um Corte + Barba de 60 min às 14:00 bloqueia 14:00 e 14:30).
4. O endpoint `horarios-disponiveis` devolve apenas os horários livres, e o app mostra só esses.
5. Preço e duração são copiados para o agendamento, então o histórico não muda se o serviço for alterado.
6. Só agendamentos com status "agendado" podem ser editados, concluídos ou cancelados.
7. Clientes, serviços e profissionais que já têm agendamentos não podem ser excluídos.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login (público) → `{ token, usuario }` |
| GET | `/auth/me` | Usuário logado |
| GET | `/dashboard` | Indicadores |
| GET/POST | `/clientes` | Listar (`?busca=`) / criar |
| GET/PUT/DELETE | `/clientes/:id` | Consultar / editar / excluir |
| GET/POST, GET/PUT/DELETE `:id` | `/servicos`, `/profissionais` | Mesmo padrão |
| GET/POST | `/agendamentos` | Listar (`?data=AAAA-MM-DD&status=`) / criar |
| GET/PUT/DELETE | `/agendamentos/:id` | Consultar / editar / excluir |
| PATCH | `/agendamentos/:id/status` | `{ "status": "concluido" \| "cancelado" }` |
| GET | `/agendamentos/horarios-disponiveis` | `?data&servico_id&profissional_id[&ignorar_id]` |
| GET/POST, GET/PUT/DELETE `:id` | `/usuarios` | Gestão de usuários (só admin) |
| GET | `/integracoes/cep/:cep` | ViaCEP via BFF |
| GET | `/integracoes/feriados/:ano` | BrasilAPI via BFF |

Erros sempre vêm como `{ "mensagem": "texto claro" }` com o status HTTP adequado (400, 401, 403, 404, 409, 429, 502).

## Como rodar (Windows)

Requisitos: **Node.js 22.13 ou mais novo** (o LTS 24 é o recomendado na aula), Expo Go no celular, e PC e celular **no mesmo Wi-Fi**.

### 1. BFF

```bash
cd bff
npm install
npm start
```

O terminal mostra `BFF Barbearia rodando na porta 3000` e os IPs do PC. Na primeira execução são criados o `.env` (com o segredo do JWT) e o banco `barbearia.db`, já com 3 usuários de demonstração, 4 serviços e 2 profissionais.

> Se você já tinha rodado a versão anterior, apague o `barbearia.db` para recriar o banco com os novos usuários.

> Na primeira vez, o Windows pode perguntar sobre o **Firewall**. Marque **Redes privadas** e clique em **Permitir**. Sem isso o celular não alcança o BFF.

### 2. App (em outro terminal)

```bash
cd app
npm install
npx expo start
```

Leia o QR Code com o Expo Go. O app descobre sozinho o IP do PC (o mesmo do Expo) e usa a porta 3000.

**Logins de demonstração** (senha `123456`; também há botões de atalho na tela de login):

| Perfil | E-mail |
|---|---|
| Administrador | `admin@barbearia.com` |
| Recepção | `recepcao@barbearia.com` |
| Profissional (João) | `joao@barbearia.com` |

Se aparecer "Sem conexão com o servidor":
- confira se o BFF está rodando;
- teste no navegador do celular: `http://IP-DO-PC:3000/health` deve mostrar `{"status":"ok"}`;
- se precisar, crie `app/.env` com `EXPO_PUBLIC_API_URL=http://IP-DO-PC:3000` e reinicie o Expo.

## Roteiro para a apresentação

1. Login com senha errada → mensagem clara. Depois, entre como **Admin**.
2. Início: próximo atendimento, números do dia e gráfico de faturamento.
3. Clientes → novo cliente → campos vazios (validação) → CEP preenche o endereço (ViaCEP).
4. Agendamentos → novo: o calendário bloqueia domingos e feriados (BrasilAPI) e mostra só os horários livres.
5. Tentar o mesmo profissional e horário (ou um sobreposto): o BFF recusa com 409.
6. Concluir um atendimento → o faturamento sobe no dashboard.
7. Botão WhatsApp → mensagem de confirmação pronta para o cliente.
8. Excluir um cliente com agendamentos → o BFF bloqueia.
9. **Perfis:** saia e entre como Recepção (sem faturamento, sem Usuários) e depois como João (só a própria agenda). Mostre no Postman que `GET /usuarios` com o token do João devolve **403**.
10. Como Admin, desative a Recepção em "Usuários e acessos": ela perde o acesso na hora.

## Sugestão de divisão (até 5 alunos)

| Aluno | Parte |
|---|---|
| 1 | Login, AuthContext, middleware JWT |
| 2 | Clientes (CRUD + ViaCEP) |
| 3 | Serviços e profissionais |
| 4 | Agendamentos (regras de conflito + BrasilAPI) |
| 5 | Dashboard e apresentação |
