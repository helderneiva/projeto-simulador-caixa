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

function formatarNascimento(evento) {
    const valorAnterior = campoNascimento.value;
    const cursorAnterior = campoNascimento.selectionStart ?? valorAnterior.length;
    const formatoISO = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valorAnterior);
    const valor = formatoISO
        ? `${formatoISO[3]}${formatoISO[2]}${formatoISO[1]}`
        : valorAnterior;
    const numeros = valor.replace(/[^0-9]/g, '').slice(0, 8);
    const digitosAntes = formatoISO
        ? numeros.length
        : valorAnterior.slice(0, cursorAnterior).replace(/[^0-9]/g, '').length;

    let formatado = numeros.slice(0, 2);

    if (numeros.length > 2) {
        formatado += '/' + numeros.slice(2, 4);
    }

    if (numeros.length > 4) {
        formatado += '/' + numeros.slice(4, 8);
    }

    campoNascimento.value = formatado;

    if (document.activeElement === campoNascimento) {
        let posicao = 0;
        let encontrados = 0;

        while (posicao < formatado.length && encontrados < digitosAntes) {
            if (/[0-9]/.test(formatado[posicao])) {
                encontrados++;
            }

            posicao++;
        }

        if (formatado[posicao] === '/' && !evento?.inputType?.startsWith('delete')) {
            posicao++;
        }

        campoNascimento.setSelectionRange(posicao, posicao);
    }
}

function obterNascimentoISO() {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(campoNascimento.value);

    if (!partes) {
        return null;
    }

    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const ano = Number(partes[3]);
    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    const diasPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > diasPorMes[mes - 1]) {
        return null;
    }

    return `${partes[3]}-${partes[2]}-${partes[1]}`;
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

    if (!campoNascimento.value) {
        return;
    }

    const nascimento = obterNascimentoISO();

    if (!nascimento) {
        campoNascimento.setCustomValidity('Informe uma data válida no formato DD/MM/AAAA.');
        return;
    }

    const [ano, mes, dia] = nascimento.split('-').map(Number);
    let idade = anoAtual - ano;

    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

    if (idade < 0) {
        campoNascimento.setCustomValidity('A data de nascimento não pode estar no futuro.');
    } else if (idade < 18) {
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

    if (campo === campoNascimento) {
        formatarNascimento(evento);
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

campoNascimento.addEventListener('beforeinput', (evento) => {
    const inicio = campoNascimento.selectionStart;
    const fim = campoNascimento.selectionEnd;

    if (inicio === null || inicio !== fim || !evento.cancelable) {
        return;
    }

    if (evento.inputType === 'deleteContentBackward' && campoNascimento.value[inicio - 1] === '/') {
        evento.preventDefault();
        campoNascimento.setRangeText('', Math.max(0, inicio - 2), inicio, 'start');
    } else if (evento.inputType === 'deleteContentForward' && campoNascimento.value[inicio] === '/') {
        evento.preventDefault();
        campoNascimento.setRangeText('', inicio, inicio + 2, 'start');
    } else {
        return;
    }

    campoNascimento.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: evento.inputType
    }));
});

formulario.addEventListener('input', atualizarValidacao);
formulario.addEventListener('change', atualizarValidacao);

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (botaoCadastrar.disabled) {
        return;
    }

    formatarCelular();
    formatarNascimento();
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
        dados.set('nascimento', obterNascimentoISO());

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
formatarNascimento();
validarIdadeETempo();