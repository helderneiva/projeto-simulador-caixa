import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { validarCadastro } from './validacao.mjs';
import { cadastrarUsuario } from './credito.mjs';
import { criarHash, verificarSenha, hashFicticio } from './senhas.mjs';
import { consultarSessao, realizarSaque, consultarMovimentacao, consultarHistorico } from './contas.mjs';

const arquivos = new Map([
    ['/', ['public/index.html', 'text/html; charset=utf-8']],
    ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
    ['/login.html', ['public/login.html', 'text/html; charset=utf-8']],
    ['/caixa.html', ['public/caixa.html', 'text/html; charset=utf-8']],
    ['/extrato.html', ['public/extrato.html', 'text/html; charset=utf-8']],
    ['/scripts/principal.js', ['public/scripts/principal.js', 'text/javascript; charset=utf-8']],
    ['/scripts/dados.js', ['public/scripts/dados.js', 'text/javascript; charset=utf-8']],
    ['/scripts/extrato.js', ['public/scripts/extrato.js', 'text/javascript; charset=utf-8']],
    ['/scripts/cadastro.js', ['public/scripts/cadastro.js', 'text/javascript; charset=utf-8']],
    ['/scripts/login.js', ['public/scripts/login.js', 'text/javascript; charset=utf-8']]
]);

arquivos.set('/favicon.ico', ['public/favicon.ico', 'image/x-icon']);
arquivos.set('/imagens/favicon.png', ['public/imagens/favicon.png', 'image/png']);
arquivos.set('/imagens/favicon-caixa.png', ['public/imagens/favicon-caixa.png', 'image/png']);
arquivos.set('/imagens/notas/nota-2.jpg', ['public/imagens/notas/nota-2.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-5.jpg', ['public/imagens/notas/nota-5.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-10.jpg', ['public/imagens/notas/nota-10.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-20.jpg', ['public/imagens/notas/nota-20.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-50.jpg', ['public/imagens/notas/nota-50.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-100.jpg', ['public/imagens/notas/nota-100.jpg', 'image/jpeg']);
arquivos.set('/imagens/notas/nota-200.jpg', ['public/imagens/notas/nota-200.jpg', 'image/jpeg']);
arquivos.set('/estilos/base.css', ['public/estilos/base.css', 'text/css; charset=utf-8']);
arquivos.set('/estilos/acesso.css', ['public/estilos/acesso.css', 'text/css; charset=utf-8']);
arquivos.set('/estilos/caixa.css', ['public/estilos/caixa.css', 'text/css; charset=utf-8']);
arquivos.set('/estilos/extrato.css', ['public/estilos/extrato.css', 'text/css; charset=utf-8']);
arquivos.set('/scripts/cedulas.js', ['public/scripts/cedulas.js', 'text/javascript; charset=utf-8']);
arquivos.set('/scripts/cartao.js', ['public/scripts/cartao.js', 'text/javascript; charset=utf-8']);

for (const fonte of ['DMSans-VariableFont_opsz,wght.ttf', 'Newsreader-VariableFont_opsz,wght.ttf', 'PlusJakartaSans-VariableFont_wght.ttf']) {
    arquivos.set(`/fontes/${fonte}`, [`public/fontes/${fonte}`, 'font/ttf']);
}

const raiz = new URL('../', import.meta.url);
const duracaoSessao = 2 * 60 * 60;

function resumoToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function tokenDaRequisicao(requisicao) {
    const valor = (requisicao.headers.cookie ?? '')
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('sessao='))
        ?.slice(7);

    return valor && /^[a-f0-9]{64}$/.test(valor) ? valor : null;
}

function lerFormulario(requisicao) {
    if (requisicao.headers['content-type']?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') {
        requisicao.resume();
        const erro = new Error('Formato de formulário não suportado.');
        erro.status = 415;
        throw erro;
    }

    return new Promise((resolve, reject) => {
        let tamanho = 0;
        const partes = [];

        requisicao.on('data', (parte) => {
            tamanho += parte.length;
            if (tamanho <= 16384) partes.push(parte);
        });

        requisicao.on('end', () => {
            if (tamanho > 16384) {
                const erro = new Error('O formulário excede o tamanho permitido.');
                erro.status = 413;
                reject(erro);
                return;
            }

            const formulario = new URLSearchParams(Buffer.concat(partes).toString('utf8'));
            const dados = {};

            for (const [chave, valor] of formulario) {
                if (Object.hasOwn(dados, chave)) {
                    const erro = new Error('O formulário contém campos duplicados.');
                    erro.status = 400;
                    reject(erro);
                    return;
                }

                Object.defineProperty(dados, chave, { value: valor, enumerable: true });
            }

            resolve(dados);
        });

        requisicao.on('error', reject);
    });
}

export function criarServidor(pool, { origem, producao = false }) {
    const tentativas = new Map();

    const servidor = createServer(async function (requisicao, resposta) {
        const json = (status, dados) => {
            resposta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
            resposta.end(requisicao.method === 'HEAD' ? undefined : JSON.stringify(dados));
        };

        const cookie = (token, segundos) => {
            resposta.setHeader('Set-Cookie', `sessao=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${segundos}${producao ? '; Secure' : ''}`);
        };

        resposta.setHeader('Cache-Control', 'no-store');
        resposta.setHeader('X-Content-Type-Options', 'nosniff');
        resposta.setHeader('Referrer-Policy', 'same-origin');
        resposta.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
        );

        try {
            const url = new URL(requisicao.url, origem);
            const caminho = url.pathname;

            if (requisicao.method === 'POST') {
                if (!['/cadastro', '/login', '/sair', '/saque'].includes(caminho)) {
                    requisicao.resume();
                    json(404, { mensagem: 'Endereço não encontrado.' });
                    return;
                }

                // Impede que formulários de outros sites alterem esta sessão.
                if (requisicao.headers.origin !== origem) {
                    requisicao.resume();
                    json(403, { mensagem: 'Origem não autorizada. Atualize a página e tente novamente.' });
                    return;
                }

                if (caminho !== '/sair') {
                    // Limite por endereço da conexão, sem confiar em cabeçalhos do cliente.
                    const chave = `${requisicao.socket.remoteAddress}:${caminho}`;
                    const agora = Date.now();
                    const anterior = tentativas.get(chave);
                    const registro = anterior && anterior.ate > agora ? anterior : { quantidade: 0, ate: agora + 600000 };
                    registro.quantidade++;
                    tentativas.set(chave, registro);

                    if (registro.quantidade > 20) {
                        requisicao.resume();
                        resposta.setHeader('Retry-After', String(Math.ceil((registro.ate - agora) / 1000)));
                        json(429, { mensagem: 'Muitas tentativas. Aguarde alguns minutos.' });
                        return;
                    }
                }

                if (caminho === '/sair') {
                    requisicao.resume();
                    const token = tokenDaRequisicao(requisicao);

                    if (token) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [resumoToken(token)]);

                    cookie('', 0);
                    json(200, { mensagem: 'Sessão encerrada.' });
                    return;
                }

                const entrada = await lerFormulario(requisicao);

                if (caminho === '/saque') {
                    const token = tokenDaRequisicao(requisicao);
                    const resultado = await realizarSaque(pool, token ? resumoToken(token) : null, entrada);
                    json(resultado.repetido ? 200 : 201, resultado);
                    return;
                }

                if (caminho === '/cadastro') {
                    const { dados, erros } = validarCadastro(entrada);

                    if (Object.keys(erros).length) {
                        json(422, { mensagem: 'Confira os campos indicados.', erros });
                        return;
                    }

                    const senhaHash = await criarHash(dados.sen);

                    try {
                        await cadastrarUsuario(pool, dados, senhaHash);
                    } catch (erro) {
                        if (erro.code !== '23505') throw erro;

                        json(409, { mensagem: 'Não foi possível cadastrar: usuário ou e-mail já utilizado.' });
                        return;
                    }

                    json(201, { mensagem: 'Conta criada. Entre com seu usuário e senha.', destino: '/login.html?cadastro=sucesso' });
                    return;
                }

                const usuario = typeof entrada.usu === 'string' ? entrada.usu.trim().toLowerCase() : '';
                const senha = typeof entrada.sen === 'string' ? entrada.sen : '';

                if (!/^[a-z0-9_.-]{6,18}$/.test(usuario) || senha.length < 8 || senha.length > 128) {
                    json(401, { mensagem: 'Usuário ou senha incorretos.' });
                    return;
                }

                const consulta = await pool.query('SELECT id, senha_hash FROM usuarios WHERE usuario = $1', [usuario]);
                const pessoa = consulta.rows[0];
                const confere = await verificarSenha(senha, pessoa?.senha_hash ?? hashFicticio);

                if (!pessoa || !confere) {
                    json(401, { mensagem: 'Usuário ou senha incorretos.' });
                    return;
                }

                const token = randomBytes(32).toString('hex');
                const anterior = tokenDaRequisicao(requisicao);

                if (anterior) await pool.query('DELETE FROM sessoes WHERE token_hash = $1', [resumoToken(anterior)]);

                await pool.query('DELETE FROM sessoes WHERE expira_em <= CURRENT_TIMESTAMP');
                await pool.query(
                    `INSERT INTO sessoes (token_hash, usuario_id, expira_em)
                    VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '2 hours')`,
                    [resumoToken(token), pessoa.id]
                );

                cookie(token, duracaoSessao);
                json(200, { mensagem: 'Login realizado.' });
                return;
            }

            if (requisicao.method !== 'GET' && requisicao.method !== 'HEAD') {
                requisicao.resume();
                resposta.setHeader('Allow', 'GET, HEAD, POST');
                json(405, { mensagem: 'Método não permitido.' });
                return;
            }

            if (['/estado-sessao', '/sessao', '/historico', '/movimentacao'].includes(caminho)) {
                const token = tokenDaRequisicao(requisicao);
                const sessao = await consultarSessao(pool, token ? resumoToken(token) : null);

                if (caminho === '/estado-sessao') {
                    if (!sessao) cookie('', 0);

                    json(200, { autenticado: Boolean(sessao) });
                    return;
                }

                if (!sessao) {
                    cookie('', 0);
                    json(401, { mensagem: 'Entre na sua conta para continuar.' });
                    return;
                }

                if (caminho === '/sessao') {
                    json(200, sessao);
                } else if (caminho === '/historico') {
                    json(200, await consultarHistorico(pool, sessao.conta.id, url.searchParams.get('antes')));
                } else {
                    json(200, { movimentacao: await consultarMovimentacao(pool, sessao.conta.id, url.searchParams.get('id') ?? '') });
                }

                return;
            }

            const arquivo = arquivos.get(caminho);

            if (!arquivo) {
                json(404, { mensagem: 'Página ou arquivo não encontrado.' });
                return;
            }

            const [local, tipo] = arquivo;
            let conteudo;

            try {
                conteudo = await readFile(new URL(local, raiz));
            } catch (erro) {
                if (erro.code !== 'ENOENT') throw erro;

                json(404, { mensagem: 'Página ou arquivo não encontrado.' });
                return;
            }

            resposta.writeHead(200, { 'Content-Type': tipo });
            resposta.end(requisicao.method === 'HEAD' ? undefined : conteudo);
        } catch (erro) {
            // Não registra senhas, cookies ou a conexão do banco.
            if (erro.status) {
                json(erro.status, { mensagem: erro.message });
            } else {
                console.error('Falha ao processar requisição. Código:', erro.code ?? 'INTERNO');
                json(503, { mensagem: 'Serviço indisponível. Tente novamente em instantes.' });
            }
        }
    });

    servidor.requestTimeout = 15000;
    servidor.headersTimeout = 15000;

    const limpeza = setInterval(() => {
        for (const [chave, valor] of tentativas) if (valor.ate <= Date.now()) tentativas.delete(chave);
    }, 60000);

    limpeza.unref();
    servidor.on('close', () => clearInterval(limpeza));

    return servidor;
}