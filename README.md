# Simulador de Conta Bancária

Aplicação com cadastro, autenticação, crédito inicial baseado em dados da RAIS, saques e extrato. Desenvolvida com HTML5, CSS3, JavaScript puro, Node.js e PostgreSQL.

**[Acessar o projeto](https://projeto-simulador-caixa.onrender.com)** · **[Código-fonte](https://github.com/helderneiva/projeto-simulador-caixa)**

## Funcionalidades

- Cadastro com validação no navegador e no servidor, idade mínima de 18 anos e verificação da coerência entre idade e tempo de emprego.
- Login, sessão temporária e encerramento da sessão.
- Crédito inicial definido a partir da profissão, UF, escolaridade e tempo no emprego, conforme a disponibilidade dos recortes.
- Quatro denominações diferentes por conta, sorteadas entre R$ 2, R$ 5, R$ 10, R$ 20, R$ 50, R$ 100 e R$ 200.
- Saques em reais inteiros, com validação do saldo e composição com a menor quantidade possível de cédulas disponíveis.
- Extrato paginado, consulta das movimentações e impressão de comprovantes.
- Persistência de contas, saldos e movimentações no PostgreSQL.
- Interface responsiva com fontes e imagens locais.

## Tecnologias

- HTML5, CSS3 e JavaScript sem frameworks.
- Node.js 24 ou superior, com servidor HTTP nativo.
- PostgreSQL e pacote `pg`.
- Neon para o banco e Render para a aplicação publicada.

## Estrutura

- `banco/`: conexão, scripts SQL e preparação das tabelas.
- `dados/`: consulta SQL, exportação da RAIS, importador e catálogo de referências por perfil.
- `logica/`: rotas, autenticação, validações, crédito, contas e composição dos saques.
- `public/`: páginas, estilos, scripts, fontes e imagens.
- `servidor.mjs`: configuração e inicialização do servidor.

## Executar localmente

Instale o Node.js 24 ou superior e tenha uma conexão PostgreSQL disponível.

```bash
git clone https://github.com/helderneiva/projeto-simulador-caixa.git
cd projeto-simulador-caixa
npm ci
```

Crie o arquivo `.env` na raiz do projeto:

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require
NODE_ENV=development
APP_ORIGIN=http://localhost:3000
PORT=3000
```

Substitua `DATABASE_URL` pela string de conexão do seu banco. O arquivo `.env` deve permanecer fora do versionamento.

Prepare as tabelas e inicie o servidor:

```bash
npm run banco:criar
npm start
```

Acesse [http://localhost:3000](http://localhost:3000). Para reiniciar automaticamente o servidor durante o desenvolvimento, use `npm run dev`.

A preparação do banco aplica os scripts da pasta `banco/` e os créditos iniciais pendentes. Contas que já receberam o crédito inicial são preservadas. O servidor verifica a estrutura ao iniciar; não executa essa preparação automaticamente.

## Crédito inicial e referências

O catálogo `dados/referencias-perfil.json` reúne 5.588 recortes gerados pela consulta da RAIS 2025, abrangendo as 14 categorias profissionais do cadastro.

A consulta seleciona vínculos ativos em 31 de dezembro, com remuneração média positiva, e calcula a média em centavos. Os recortes usam profissão, UF, escolaridade e tempo no emprego. Cada grupo precisa conter pelo menos 30 vínculos para ser utilizado.

O sistema procura uma referência nesta ordem:

1. Profissão, UF, escolaridade e tempo no emprego.
2. Profissão, escolaridade e tempo no emprego, em âmbito nacional.
3. Profissão, UF e escolaridade.
4. Profissão, UF e tempo no emprego.
5. Profissão e escolaridade, em âmbito nacional.
6. Profissão e tempo no emprego, em âmbito nacional.
7. Profissão e UF.
8. Profissão, em âmbito nacional.

O valor corresponde a uma única média do grupo selecionado. Idade, sexo e modalidade de trabalho não são multiplicadores do crédito. A idade participa das validações do cadastro. O tempo informado corresponde ao tempo no emprego atual.

Os filtros utilizados e a quantidade de vínculos são registrados com a movimentação inicial. Atualizar o catálogo não recalcula créditos de contas já cadastradas.

### Atualizar o catálogo

Gere a consulta SQL:

```bash
node dados/preparar-perfil.mjs consulta
```

Execute `dados/consulta-perfil.sql` no BigQuery e exporte o resultado completo como JSON para `dados/exportacao-rais.json`. Importe o arquivo:

```bash
node dados/preparar-perfil.mjs importar dados/exportacao-rais.json
```

Reinicie o servidor para carregar o catálogo atualizado. O importador não executa consultas no BigQuery nem altera o banco de contas.

### Fontes

- Microdados: `basedosdados.br_me_rais.microdados_vinculos`, consultados no BigQuery.
- [Base dos Dados](https://basedosdados.org/).
- [Tabulação secundária utilizada nas referências de apoio](https://github.com/PedroBartkevihi/painel-rais-2025).
- Consulta e critérios de agregação disponíveis em `dados/consulta-perfil.sql`.

## Publicação

O serviço publicado utiliza estas configurações no Render:

| Campo | Valor |
| --- | --- |
| Tipo | Web Service |
| Linguagem | Node |
| Branch | `main` |
| Root Directory | Em branco |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| `NODE_ENV` | `production` |
| `APP_ORIGIN` | `https://projeto-simulador-caixa.onrender.com` |
| `DATABASE_URL` | String de conexão do PostgreSQL configurada no painel |
| `EMBED_ORIGINS` | Origem HTTPS do laboratório autorizado a incorporar o simulador |

Em produção, `APP_ORIGIN` deve corresponder à origem HTTPS usada para acessar a aplicação. A porta é recebida pela variável `PORT` da plataforma.

## Abertura no Laboratório JavaScript

O card do laboratório aponta para o endereço público no Render e utiliza a janela interna já existente no laboratório.

Configure `EMBED_ORIGINS` no Render com a origem HTTPS exata do laboratório, sem caminho. Para o endereço padrão do GitHub Pages deste usuário, use `https://helderneiva.github.io`. Se o laboratório utilizar outro domínio, informe a origem correspondente. É possível autorizar mais de uma origem separando-as por vírgula.

Sem essa variável, a incorporação permanece bloqueada. A variável controla quem pode incorporar as páginas; os POSTs continuam aceitando somente a origem do próprio simulador, definida em `APP_ORIGIN`.

Com a incorporação habilitada em produção, o cookie é particionado. A sessão na janela interna pode ser independente da sessão aberta diretamente no Render. Restrições do navegador ao armazenamento incorporado ainda podem afetar o login; o botão existente “Abrir em nova aba” permanece disponível.

## Autenticação e integridade das operações

- Senhas protegidas com `scrypt` e salt individual.
- Tokens de sessão armazenados como hash no banco.
- Cookies `HttpOnly` e `SameSite=Lax`, com `Secure` em produção. Quando a incorporação é habilitada em produção, a sessão utiliza `SameSite=None; Secure; Partitioned`.
- Validação da origem das requisições POST e lista de arquivos estáticos permitidos.
- Operações monetárias em centavos inteiros, usando `BIGINT` e `BigInt`.
- Saques com transação, bloqueio da conta durante a operação e identificador para evitar duplicação de uma mesma solicitação.
- Limitação de tentativas em memória por endereço do socket e rota. Os contadores pertencem ao processo e são reiniciados com o servidor.