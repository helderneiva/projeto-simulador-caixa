# Simulador de Conta Bancária

Aplicação web de **simulação bancária**, criada como projeto de portfólio para demonstrar a integração entre HTML5, CSS3, JavaScript puro, Node.js e PostgreSQL.

> **Atenção:** este projeto é exclusivamente educacional. Não representa uma instituição financeira, não movimenta dinheiro real e não calcula salários individuais reais.

## Funcionalidades

- Cadastro de usuários com validação no navegador e no servidor.
- Autenticação, sessão temporária e encerramento de sessão.
- Crédito inicial virtual baseado na referência nacional de remuneração da profissão selecionada.
- Saques virtuais com validação do saldo e composição das cédulas disponibilizadas.
- Registro das movimentações, consulta do extrato e comprovante imprimível.
- Layout responsivo, navegação por teclado e mensagens de status acessíveis.

## Tecnologias

- **Interface:** HTML5, CSS3 e JavaScript (sem framework de front-end).
- **Servidor:** Node.js 24+ com módulo nativo `node:http`.
- **Banco:** PostgreSQL (compatível com Neon) e pacote `pg`.
- **Publicação sugerida:** Render Web Service.

## Estrutura principal

```text
simulador-conta-bancaria/
├── banco/                  # Conexão, SQL e criação das tabelas (arquivos do projeto original)
├── logica/
│   ├── aplicacao.mjs       # Rotas, sessão e arquivos estáticos
│   ├── contas.mjs          # Saques, extratos e sessão
│   ├── credito.mjs         # Crédito inicial transacional
│   ├── limite-tentativas.mjs
│   ├── referencias.mjs     # Referências de profissões
│   ├── saques.mjs          # Distribuição de notas (projeto original)
│   ├── senhas.mjs          # Senhas (projeto original)
│   └── validacao.mjs       # Validação (projeto original)
├── public/
│   ├── imagens/
│   │   ├── favicon.png
│   │   └── notas/
│   ├── estilos/
│   ├── scripts/
│   ├── favicon.ico
│   ├── caixa.html
│   ├── extrato.html
│   ├── index.html
│   └── login.html
├── testes/
│   └── limite-tentativas.test.mjs
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── render.yaml
└── servidor.mjs
```

## Executar localmente

1. Instale o Node.js **24 ou superior** e tenha acesso a um banco PostgreSQL.
2. Instale as dependências com `npm ci`.
3. Copie `.env.example` para `.env` e informe a URL do banco em `DATABASE_URL`.
4. **Com o banco de testes e após revisar o script `banco/criar.mjs` do seu projeto original**, execute `npm run banco:criar` caso as tabelas ainda precisem ser preparadas. Antes de rodar em um banco que já contém contas ou movimentações, faça backup e confirme que o script não apaga nem reinicializa dados.
5. Execute `npm test` para os testes do limitador e `npm start` para iniciar a aplicação.
6. Acesse `http://localhost:3000`.

O servidor verifica se as tabelas necessárias já existem e se há créditos iniciais pendentes; não executa migrações automaticamente ao iniciar.

### Variáveis de ambiente

| Nome | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL; deve ficar em segredo. |
| `PORT` | Porta HTTP; localmente, `3000`. No Render, é configurada pela plataforma. |
| `NODE_ENV` | Use `production` no servidor publicado. |
| `APP_ORIGIN` | Origem pública exata do site, sem `/` final obrigatório, como `https://seu-site.onrender.com`. |
| `RENDER_EXTERNAL_URL` | Origem padrão disponibilizada automaticamente pelo Render, utilizada se `APP_ORIGIN` não for definida. |

A variável `APP_ORIGIN` é opcional no Render quando o usuário acessa o endereço padrão `onrender.com`, mas é necessária caso se utilize um domínio próprio diferente.

## Publicar com Neon e Render

1. No **Neon**, crie um projeto PostgreSQL. Copie a string de conexão apropriada para o servidor. Prefira conexão TLS com verificação do certificado, sem desabilitar a checagem (`rejectUnauthorized: false`).
2. Prepare o esquema do banco usando os scripts SQL do projeto original. **Não execute scripts de criação ou reinicialização sem verificar seu efeito sobre dados existentes.**
3. Envie o repositório ao GitHub. Antes, confirme com `git status` que **`.env` não está versionado**.
4. No **Render**, crie um *Blueprint* a partir do arquivo `render.yaml` ou um serviço **Web Service** usando Node.js.
5. Forneça `DATABASE_URL` em **Environment**, no painel do Render, e não no repositório. O Blueprint solicita esse valor porque usa `sync: false`.
6. Configure `npm ci` como comando de construção e `npm start` como comando de inicialização. Configure `/health` como caminho de verificação de saúde.
7. Acesse o endereço HTTPS informado pelo Render e teste cadastro, login, saldo, saque, extrato e saída.

O projeto usa um cookie de sessão `HttpOnly` e `SameSite=Lax`; com `NODE_ENV=production`, o cookie também recebe `Secure`.

### Limite de tentativas

- Cadastro: **8** tentativas por IP a cada dez minutos.
- Login: **15** tentativas por IP a cada dez minutos.
- Saque: **60** tentativas por IP a cada dez minutos.
- Encerramento da sessão: não usa o mesmo limitador de tentativas.

No Render, o aplicativo considera o endereço IP encaminhado pela infraestrutura da plataforma, preferindo `CF-Connecting-IP`. Fora do Render, usa o endereço do socket. **Esses contadores são armazenados na memória de um processo**: não são compartilhados entre instâncias nem persistem após reiniciar. Em escala maior, substitua por um armazenamento centralizado, como Redis, e considere proteção adicional por usuário no login.

## Metodologia do crédito inicial

O crédito virtual corresponde à referência **nacional por profissão** presente em `logica/referencias.mjs`, identificada no projeto como RAIS 2025, com tabulação secundária. O campo `valorCentavos` é gravado numa movimentação do tipo `credito_inicial` e utilizado como saldo inicial. O crédito não é um pagamento de salário real.

**Nesta versão, o cálculo considera somente a profissão.** Dados de idade, tempo de emprego, estado, sexo, escolaridade e modalidade de trabalho ficam registrados no perfil, mas não modificam a referência nacional. As 14 categorias do cadastro incluem profissões agregadas por mais de um código CBO; algumas podem compartilhar o mesmo valor por utilizarem o mesmo código de referência.

A relação completa dos valores e códigos CBO está em `logica/referencias.mjs`. É importante conferir a procedência e a metodologia de cada agregação caso os valores sejam apresentados como estatísticas oficiais; esta versão registra as referências informadas no projeto, não fornece verificação independente de todos os cálculos.

**Fontes informadas pelo projeto:**

- [RAIS 2025 – Ministério do Trabalho e Emprego](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/rais/rais-2025/rais-2025)
- [Tabulação secundária referenciada no código](https://github.com/PedroBartkevihi/painel-rais-2025)

Uma versão futura poderá usar recortes reais da RAIS por ocupação, UF, escolaridade e outras características, sempre com transparência sobre amostras, comparabilidade e limitações. **Não se deve inventar coeficientes de ajuste e apresentá-los como conclusões da RAIS.**

## Segurança e limitações

- Senhas e dados pessoais são tratados no servidor; não inclua credenciais ou dados pessoais verdadeiros em capturas de tela do portfólio.
- Operações de saque são transacionais e usam identificadores para evitar duplicação acidental.
- Há validação de `Origin` nos POSTs, cabeçalhos básicos de segurança e uma lista explícita de recursos estáticos permitidos.
- Não configure o servidor diretamente exposto a uma rede pública fora do Render sem reavaliar o modelo de confiança dos cabeçalhos de proxy.
- Este repositório não deve conter arquivos `.env`, senhas, chaves ou dados de usuários.
- O código foi preparado para publicação, mas a validação end-to-end depende dos arquivos restantes do projeto e de um banco PostgreSQL configurado.

## Checklist de apresentação

- [ ] Repositório sem segredos nem arquivos pessoais.
- [ ] Banco preparado sem perda de contas existentes.
- [ ] Serviço no Render com `DATABASE_URL` configurada.
- [ ] `GET /health` retornando `200`.
- [ ] Cadastro, login e saída testados.
- [ ] Crédito inicial, saque e extrato conferidos em ambiente de testes.
- [ ] Favicon e imagem da marca renderizados corretamente.
- [ ] Link público adicionado ao Laboratório JavaScript.

## Créditos visuais

A interface utiliza uma identidade visual própria. As imagens de cédulas, quando presentes no projeto original, são identificadas na página como materiais do Banco Central do Brasil disponibilizados via Wikimedia Commons. Verifique as condições de uso e atribuição de cada arquivo antes da publicação pública.
