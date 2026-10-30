const formulario = document.getElementById('formulario-cadastro');
const campoCelular = document.getElementById('tel');
const campoNascimento = document.getElementById('nascimento');
const campoTempo = document.getElementById('tempo-emprego');
const campoNome = document.getElementById('nome');
const campoSobrenome = document.getElementById('sobrenome');
const campoUsuario = document.getElementById('usu');
const campoSenha = document.getElementById('sen');
const mensagemCadastro = document.getElementById('mensagem-cadastro');
const botaoCadastrar = formulario.querySelector('button[type="submit"]');

const idadesMinimas = {
    'ate-1': 18,
    'mais-1-ate-5': 20,
    'mais-5-ate-10': 24
};

function formatarCelular() {
    const valorAnterior = campoCelular.value;
    const cursorAnterior = campoCelular.selectionStart ?? valorAnterior.length;
    const digitosAntes = valorAnterior.slice(0, cursorAnterior).replace(/[^0-9]/g, '').length;
    const numeros = valorAnterior.replace(/[^0-9]/g, '').slice(0, 11);

    let formatado = '';

    if (numeros.length > 0) {
        formatado = '(' + numeros.slice(0, 2);
    }

    if (numeros.length >= 3) {
        formatado += ') ' + numeros.slice(2, 7);
    }

    if (numeros.length >= 8) {
        formatado += '-' + numeros.slice(7, 11);
    }

    campoCelular.value = formatado;

    if (document.activeElement === campoCelular) {
        let posicao = formatado.length;

        if (cursorAnterior < valorAnterior.length) {
            posicao = 0;
            let encontrados = 0;

            while (posicao < formatado.length && encontrados < digitosAntes) {
                if (/[0-9]/.test(formatado[posicao])) {
                    encontrados++;
                }

                posicao++;
            }
        }

        campoCelular.setSelectionRange(posicao, posicao);
    }
}

function validarIdadeETempo() {
    campoNascimento.setCustomValidity('');
    campoTempo.setCustomValidity('');

    const formatador = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const partes = Object.fromEntries(
        formatador.formatToParts(new Date()).map((parte) => {
            return [parte.type, parte.value];
        })
    );

    const anoAtual = Number(partes.year);
    const mesAtual = Number(partes.month);
    const diaAtual = Number(partes.day);
    const anoLimite = anoAtual - 18;
    const ultimoDia = new Date(anoLimite, mesAtual, 0).getDate();
    const diaLimite = Math.min(diaAtual, ultimoDia);

    campoNascimento.max = [anoLimite, String(mesAtual).padStart(2, '0'), String(diaLimite).padStart(2, '0')].join('-');

    if (!campoNascimento.value) {
        return;
    }

    const [ano, mes, dia] = campoNascimento.value.split('-').map(Number);
    let idade = anoAtual - ano;

    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

    if (idade < 18) {
        campoNascimento.setCustomValidity('É necessário ter pelo menos 18 anos completos.');
    }

    const idadeMinima = idadesMinimas[campoTempo.value];

    if (idadeMinima !== undefined && idade < idadeMinima) {
        campoTempo.setCustomValidity(`Essa faixa exige pelo menos ${idadeMinima} anos nesta simulação.`);
    }
}

function validarTexto(campo) {
    const apenasEspacos = campo.value.length > 0 && !campo.value.trim();
    campo.setCustomValidity(apenasEspacos ? 'Preencha este campo sem utilizar apenas espaços.' : '');
}

function atualizarValidacao(evento) {
    const campo = evento.target;

    if (!(campo instanceof HTMLInputElement) && !(campo instanceof HTMLSelectElement)) {
        return;
    }

    if (campo instanceof HTMLInputElement && campo.type === 'radio') {
        const grupo = formulario.elements.namedItem(campo.name);

        if (grupo instanceof RadioNodeList) {
            for (const opcao of grupo) {
                if (opcao instanceof HTMLInputElement) {
                    opcao.setCustomValidity('');
                }
            }
        } else {
            campo.setCustomValidity('');
        }
    } else {
        campo.setCustomValidity('');
    }

    if (campo === campoCelular) {
        formatarCelular();
    }

    if (campo === campoNascimento || campo === campoTempo) {
        validarIdadeETempo();
    }

    if (campo === campoNome || campo === campoSobrenome || campo === campoUsuario) {
        validarTexto(campo);
    }
}

function apresentarErros(erros) {
    for (const [nome, texto] of Object.entries(erros)) {
        const campo = formulario.elements.namedItem(nome);

        if (campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement) {
            campo.setCustomValidity(texto);
        } else if (campo instanceof RadioNodeList) {
            for (const opcao of campo) {
                if (opcao instanceof HTMLInputElement) {
                    opcao.setCustomValidity(texto);
                }
            }
        }
    }

    formulario.reportValidity();
}

formulario.addEventListener('input', atualizarValidacao);
formulario.addEventListener('change', atualizarValidacao);

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (botaoCadastrar.disabled) {
        return;
    }

    formatarCelular();
    validarIdadeETempo();

    for (const campo of [campoNome, campoSobrenome, campoUsuario]) {
        campo.value = campo.value.trim();
        validarTexto(campo);
    }

    if (!formulario.reportValidity()) {
        return;
    }

    botaoCadastrar.disabled = true;
    formulario.setAttribute('aria-busy', 'true');
    mensagemCadastro.textContent = 'Enviando cadastro…';

    let redirecionando = false;

    try {
        const dados = new URLSearchParams(new FormData(formulario));

        const resposta = await fetch(formulario.action, {
            method: 'POST',
            body: dados
        });

        const resultado = await resposta.json();
        mensagemCadastro.textContent = resultado.mensagem;

        if (resposta.status === 201) {
            redirecionando = true;
            window.location.assign('/login.html?cadastro=sucesso');
            return;
        }

        if (resultado.erros) {
            apresentarErros(resultado.erros);
        }
    } catch {
        mensagemCadastro.textContent = 'Não foi possível confirmar o cadastro. Verifique a conexão com o servidor.';
    } finally {
        campoSenha.value = '';

        if (!redirecionando) {
            botaoCadastrar.disabled = false;
            formulario.removeAttribute('aria-busy');
        }
    }
});

formatarCelular();
validarIdadeETempo();