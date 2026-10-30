import { dinheiro, preencherPerfil, redirecionarLogin, resumirCredito, profissoes } from './dados.js';
import { criarImagemCedula } from './cedulas.js';

const main = document.getElementById('conteudo-principal');
const painel = document.getElementById('painel-conta');
const mensagem = document.getElementById('mensagem-caixa');
const listaNotas = document.getElementById('notas-disponiveis');
const formulario = document.getElementById('formulario-saque');
const campoValor = document.getElementById('valor-saque');
const mensagemSaque = document.getElementById('mensagem-saque');
const botaoSacar = formulario.querySelector('button[type="submit"]');
const botaoSair = document.getElementById('sair');
const tentar = document.getElementById('tentar-novamente');
const atalhos = document.getElementById('atalhos-saque');
const textoBotaoSacar = botaoSacar.textContent.trim();

let contaId;
let carregando = false;
let ocupada = false;
let pendente = null;

function atualizarAtalhos() {
    for (const botao of atalhos.querySelectorAll('button')) {
        botao.disabled = ocupada || Boolean(pendente && pendente.valor !== botao.dataset.valor);
    }
}

function prepararAtalhos(notas, saldoCentavos) {
    const possivel = Array(201).fill(false);
    possivel[0] = true;

    for (let valor = 1; valor <= 200; valor++) {
        possivel[valor] = notas.some((nota) => valor >= nota && possivel[valor - nota]);
    }

    const valores = [20, 50, 100, 200].filter((valor) => {
        return possivel[valor] && BigInt(valor) * 100n <= BigInt(saldoCentavos);
    });

    atalhos.replaceChildren(...valores.map((valor) => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.dataset.valor = String(valor);
        botao.textContent = `R$ ${valor}`;

        botao.addEventListener('click', () => {
            if (ocupada || (pendente && pendente.valor !== String(valor))) {
                return;
            }

            campoValor.value = String(valor);
            campoValor.setCustomValidity('');
            campoValor.focus();
        });

        return botao;
    }));

    atualizarAtalhos();
}

function guardarPendente(valor) {
    pendente = valor;
    atualizarAtalhos();

    try {
        const chave = `saque-pendente:${contaId}`;

        if (valor) {
            sessionStorage.setItem(chave, JSON.stringify(valor));
        } else {
            sessionStorage.removeItem(chave);
        }
    } catch {
        // A operação continua se o armazenamento estiver bloqueado.
    }
}

function restaurarPendente() {
    pendente = null;

    try {
        const valor = JSON.parse(sessionStorage.getItem(`saque-pendente:${contaId}`));

        if (valor && typeof valor.chave === 'string' && /^[1-9][0-9]*$/.test(valor.valor)) {
            pendente = valor;
            campoValor.value = valor.valor;
            mensagemSaque.textContent = 'Há um saque sem confirmação. Clique em Sacar para consultar ou concluir a mesma operação.';
        }
    } catch {
        // Não há uma operação recuperável.
    }
}

async function carregarConta() {
    if (carregando || ocupada) {
        return;
    }

    carregando = true;
    painel.hidden = true;
    tentar.hidden = true;
    main.setAttribute('aria-busy', 'true');
    mensagem.textContent = 'Carregando sua conta…';

    try {
        const resposta = await fetch('/sessao', { cache: 'no-store' });

        if (resposta.status === 401) {
            return redirecionarLogin();
        }

        if (!resposta.ok) {
            throw new Error();
        }

        const { usuario, conta } = await resposta.json();
        const notas = conta.notasDisponiveis;

        if (!Array.isArray(notas) || notas.length !== 4 || new Set(notas).size !== 4 || notas.some((nota) => ![2, 5, 10, 20, 50, 100, 200].includes(nota))) {
            throw new Error();
        }

        contaId = conta.id;

        document.getElementById('titular-resumo').textContent = `${usuario.nome} ${usuario.sobrenome}`;
        document.getElementById('profissao-resumo').textContent = profissoes[usuario.profissao];
        document.getElementById('numero-conta').textContent = conta.id;
        document.getElementById('saldo-disponivel').textContent = dinheiro(conta.saldoCentavos);

        let referencia = document.getElementById('referencia-credito');

        if (!referencia) {
            referencia = document.createElement('p');
            referencia.id = 'referencia-credito';
            document.getElementById('saldo-disponivel').closest('.saldo').append(referencia);
        }

        referencia.textContent = resumirCredito(conta.creditoInicial);
        preencherPerfil(document.getElementById('perfil-conta'), usuario);

        const itens = [...notas].sort((a, b) => a - b).map((valor) => {
            const item = document.createElement('li');
            item.className = 'nota';

            const rotulo = document.createElement('span');
            rotulo.className = 'rotulo-nota';
            rotulo.textContent = `R$ ${valor}`;

            item.append(criarImagemCedula(valor), rotulo);
            return item;
        });

        listaNotas.replaceChildren(...itens);

        mensagemSaque.textContent = '';
        restaurarPendente();
        prepararAtalhos(notas, conta.saldoCentavos);

        painel.hidden = false;
        mensagem.textContent = '';
    } catch {
        mensagem.textContent = 'Não foi possível carregar sua conta. Tente novamente.';
        tentar.hidden = false;
    } finally {
        carregando = false;
        main.removeAttribute('aria-busy');
    }
}

campoValor.addEventListener('input', () => {
    campoValor.setCustomValidity('');
});

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (ocupada || carregando) {
        return;
    }

    const valor = campoValor.value;

    if (!/^[1-9][0-9]{0,15}$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
        campoValor.setCustomValidity('Informe um valor inteiro positivo, sem pontos ou vírgulas.');
        formulario.reportValidity();
        return;
    }

    if (pendente && pendente.valor !== valor) {
        campoValor.value = pendente.valor;
        mensagemSaque.textContent = 'Confirme primeiro o saque pendente. O valor anterior foi restaurado.';
        campoValor.focus();
        return;
    }

    if (!pendente) {
        guardarPendente({ valor, chave: crypto.randomUUID() });
    }

    ocupada = true;
    botaoSacar.disabled = true;
    botaoSair.disabled = true;
    campoValor.readOnly = true;
    formulario.setAttribute('aria-busy', 'true');
    mensagemSaque.textContent = 'Processando saque…';
    botaoSacar.textContent = 'Processando saque…';
    atualizarAtalhos();

    let redirecionando = false;

    try {
        const resposta = await fetch('/saque', {
            method: 'POST',
            body: new URLSearchParams(pendente)
        });

        if (resposta.status === 401) {
            redirecionando = true;
            return redirecionarLogin();
        }

        const resultado = await resposta.json();

        if (resposta.ok) {
            guardarPendente(null);
            redirecionando = true;
            window.location.assign(`/extrato.html?movimentacao=${encodeURIComponent(resultado.movimentacao.id)}`);
            return;
        }

        if (resposta.status >= 400 && resposta.status < 500 && resposta.status !== 429) {
            guardarPendente(null);
        }

        mensagemSaque.textContent = resultado.mensagem;
    } catch {
        mensagemSaque.textContent = 'Não foi possível confirmar o resultado. Tente novamente com o mesmo valor; a operação não será descontada duas vezes.';
    } finally {
        if (!redirecionando) {
            ocupada = false;
            botaoSacar.disabled = false;
            botaoSair.disabled = false;
            campoValor.readOnly = false;
            formulario.removeAttribute('aria-busy');
            botaoSacar.textContent = textoBotaoSacar;
            atualizarAtalhos();
        }
    }
});

botaoSair.addEventListener('click', async () => {
    if (ocupada) {
        return;
    }

    ocupada = true;
    botaoSair.disabled = true;
    botaoSacar.disabled = true;
    atualizarAtalhos();

    try {
        const resposta = await fetch('/sair', { method: 'POST' });

        if (!resposta.ok) {
            throw new Error();
        }

        painel.hidden = true;
        redirecionarLogin();
    } catch {
        mensagem.textContent = 'Não foi possível confirmar a saída. Tente novamente.';
    } finally {
        ocupada = false;
        botaoSair.disabled = false;
        botaoSacar.disabled = false;
        atualizarAtalhos();
    }
});

tentar.addEventListener('click', carregarConta);

window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
        void carregarConta();
    }
});

void carregarConta();