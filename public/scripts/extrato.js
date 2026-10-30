import {
    dinheiro,
    dataFormatada,
    preencherPerfil,
    redirecionarLogin,
    resumirCredito
} from './dados.js';

import { criarImagemCedula } from './cedulas.js';

const main = document.getElementById('conteudo-principal');
const painel = document.getElementById('painel-extrato');
const mensagem = document.getElementById('mensagem-extrato');
const comprovante = document.getElementById('comprovante');
const tabela = document.getElementById('movimentacoes');
const anteriores = document.getElementById('carregar-anteriores');
const tentar = document.getElementById('tentar-novamente');

let cursor = null;
let carregando = false;
let carregandoHistorico = false;

const idsExibidos = new Set();

async function consultar(url) {
    const resposta = await fetch(url, {
        cache: 'no-store'
    });

    if (resposta.status === 401) {
        redirecionarLogin();
        throw new Error('Sessão expirada.');
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.mensagem ??
            'Não foi possível consultar o extrato.'
        );
    }

    return dados;
}

function mostrarComprovante(movimentacao) {
    const saque = movimentacao.tipo === 'saque';
    const { detalhes } = movimentacao;

    document.getElementById('titulo-comprovante').textContent =
        saque
            ? 'Comprovante de saque simulado'
            : 'Crédito inicial simulado';

    document.getElementById('resumo-saque').textContent =
        saque
            ? `Você sacou ${dinheiro(movimentacao.valorCentavos)} em ${detalhes.quantidadeTotal} cédula(s).`
            : `Sua conta recebeu ${dinheiro(movimentacao.valorCentavos)} de crédito inicial simulado.`;

    const dados = [
        ['Operação', movimentacao.id],
        [
            'Data e hora de Brasília',
            dataFormatada(movimentacao.criadoEm)
        ],
        [
            saque ? 'Valor sacado' : 'Crédito recebido',
            dinheiro(movimentacao.valorCentavos)
        ],
        [
            'Saldo após a operação',
            dinheiro(movimentacao.saldoAposCentavos)
        ]
    ];

    const lista = document.getElementById('dados-movimentacao');

    const grupos = dados.map(([rotulo, valor]) => {
        const grupo = document.createElement('div');
        const termo = document.createElement('dt');
        const descricao = document.createElement('dd');

        termo.textContent = rotulo;
        descricao.textContent = valor;

        grupo.append(termo, descricao);

        return grupo;
    });

    lista.replaceChildren(...grupos);

    const notas = document.getElementById('notas-entregues');

    notas.hidden = !saque;
    notas.previousElementSibling.hidden = !saque;
    notas.replaceChildren();

    if (saque) {
        const itens = detalhes.notas.map(nota => {
            const item = document.createElement('li');

            item.className = 'nota-entregue';

            const quantidade = document.createElement('span');

            quantidade.className = 'quantidade-nota';
            quantidade.textContent =
                `${nota.quantidade} cédula(s) de R$ ${nota.valor}`;

            item.append(
                criarImagemCedula(nota.valor),
                quantidade
            );

            return item;
        });

        notas.replaceChildren(...itens);
    }

    let referencia = document.getElementById('referencia-credito');

    if (!referencia) {
        referencia = document.createElement('p');
        referencia.id = 'referencia-credito';

        document.getElementById('resumo-saque')
            .after(referencia);
    }

    referencia.hidden = saque;

    referencia.textContent = saque
        ? ''
        : resumirCredito({
            valorCentavos: movimentacao.valorCentavos,
            referencia: detalhes.referencia
        });

    if (detalhes.perfil) {
        preencherPerfil(
            document.getElementById('perfil-comprovante'),
            detalhes.perfil
        );
    } else {
        document.getElementById('perfil-comprovante')
            .replaceChildren();
    }

    comprovante.hidden = false;
}

async function carregarHistorico() {
    if (carregandoHistorico) {
        return;
    }

    carregandoHistorico = true;
    anteriores.disabled = true;

    try {
        const url = cursor
            ? `/historico?antes=${encodeURIComponent(cursor)}`
            : '/historico';

        const dados = await consultar(url);

        for (const movimentacao of dados.movimentacoes) {
            if (idsExibidos.has(movimentacao.id)) {
                continue;
            }

            const linha = document.createElement('tr');

            const valores = [
                dataFormatada(movimentacao.criadoEm),
                movimentacao.tipo === 'saque'
                    ? 'Saque'
                    : 'Crédito inicial',
                `${
                    movimentacao.tipo === 'saque' ? '−' : '+'
                } ${dinheiro(movimentacao.valorCentavos)}`,
                dinheiro(movimentacao.saldoAposCentavos)
            ];

            for (const valor of valores) {
                const celula = document.createElement('td');

                celula.textContent = valor;
                linha.append(celula);
            }

            const detalhes = document.createElement('td');
            const link = document.createElement('a');

            link.href =
                `/extrato.html?movimentacao=${
                    encodeURIComponent(movimentacao.id)
                }`;

            link.textContent =
                `Ver operação ${movimentacao.id}`;

            detalhes.append(link);
            linha.append(detalhes);
            tabela.append(linha);

            idsExibidos.add(movimentacao.id);
        }

        cursor = dados.proximoCursor;
        anteriores.hidden = cursor === null;

        document.getElementById('historico-vazio').hidden =
            idsExibidos.size > 0;
    } finally {
        carregandoHistorico = false;
        anteriores.disabled = false;
    }
}

async function carregarExtrato() {
    if (carregando || carregandoHistorico) {
        return;
    }

    carregando = true;
    painel.hidden = true;
    comprovante.hidden = true;
    tentar.hidden = true;
    anteriores.hidden = true;

    main.setAttribute('aria-busy', 'true');
    mensagem.textContent = 'Carregando extrato…';

    tabela.replaceChildren();
    idsExibidos.clear();

    cursor = null;

    try {
        const sessao = await consultar('/sessao');

        document.getElementById('saldo-atual').textContent =
            dinheiro(sessao.conta.saldoCentavos);

        const id = new URLSearchParams(
            window.location.search
        ).get('movimentacao');

        if (id !== null) {
            const dados = await consultar(
                `/movimentacao?id=${encodeURIComponent(id)}`
            );

            mostrarComprovante(dados.movimentacao);
        }

        await carregarHistorico();

        painel.hidden = false;
        mensagem.textContent = '';
    } catch (erro) {
        mensagem.textContent =
            erro.message ||
            'Não foi possível carregar o extrato.';

        tentar.hidden = false;
    } finally {
        carregando = false;
        main.removeAttribute('aria-busy');
    }
}

anteriores.addEventListener('click', () => {
    carregarHistorico().catch(() => {
        mensagem.textContent =
            'Não foi possível carregar as movimentações anteriores. Tente novamente.';
    });
});

tentar.addEventListener('click', carregarExtrato);

document.getElementById('imprimir')
    .addEventListener('click', () => {
        window.print();
    });

window.addEventListener('pageshow', evento => {
    if (evento.persisted) {
        void carregarExtrato();
    }
});

void carregarExtrato();