const formulario = document.getElementById('formulario-login');
const mensagem = document.getElementById('mensagem-login');
const campoUsuario = document.getElementById('usu');
const campoSenha = document.getElementById('sen');
const botaoEntrar = formulario.querySelector('button[type="submit"]');

let verificandoSessao = false;
let enviandoLogin = false;

const parametros = new URLSearchParams(window.location.search);
const cadastroConcluido = parametros.get('cadastro') === 'sucesso';

if (cadastroConcluido) {
    window.history.replaceState(null, '', window.location.pathname);
}

async function verificarSessao() {
    if (verificandoSessao || enviandoLogin) {
        return;
    }

    verificandoSessao = true;
    botaoEntrar.disabled = true;
    formulario.setAttribute('aria-busy', 'true');

    let redirecionando = false;

    try {
        const resposta = await fetch('/estado-sessao', { cache: 'no-store' });

        if (!resposta.ok) {
            throw new Error('Não foi possível consultar a sessão.');
        }

        const estado = await resposta.json();

        if (typeof estado.autenticado !== 'boolean') {
            throw new Error('Resposta de sessão inválida.');
        }

        if (estado.autenticado) {
            redirecionando = true;
            window.location.replace('/caixa.html');
            return;
        }

        mensagem.textContent = cadastroConcluido ? 'Conta criada. Entre com seu usuário e senha.' : '';
    } catch {
        mensagem.textContent = 'Não foi possível consultar a sessão. Você pode tentar entrar abaixo.';
    } finally {
        verificandoSessao = false;

        if (!redirecionando) {
            botaoEntrar.disabled = false;
            formulario.removeAttribute('aria-busy');
        }
    }
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (verificandoSessao || enviandoLogin) {
        return;
    }

    campoUsuario.value = campoUsuario.value.trim();

    if (!formulario.reportValidity()) {
        return;
    }

    enviandoLogin = true;
    botaoEntrar.disabled = true;
    formulario.setAttribute('aria-busy', 'true');
    mensagem.textContent = 'Verificando acesso…';

    let redirecionando = false;

    try {
        const resposta = await fetch(formulario.action, {
            method: 'POST',
            body: new URLSearchParams(new FormData(formulario))
        });

        const dados = await resposta.json();
        mensagem.textContent = dados.mensagem;

        if (resposta.ok) {
            redirecionando = true;
            window.location.replace('/caixa.html');
        }
    } catch {
        mensagem.textContent = 'Não foi possível confirmar o acesso. Confira a conexão.';
    } finally {
        campoSenha.value = '';
        enviandoLogin = false;

        if (!redirecionando) {
            botaoEntrar.disabled = false;
            formulario.removeAttribute('aria-busy');
        }
    }
});

window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
        void verificarSessao();
    }
});

void verificarSessao();