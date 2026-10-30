const estados = new Set([
    'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO',
    'AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE',
    'DF', 'GO', 'MT', 'MS',
    'ES', 'MG', 'RJ', 'SP',
    'PR', 'RS', 'SC'
]);

const profissoes = new Set([
    'professor',
    'veterinario',
    'advogado',
    'cabeleireiro',
    'cozinheiro',
    'enfermeiro',
    'designer-grafico',
    'farmaceutico',
    'programador',
    'analista-sistemas',
    'desenvolvedor-software',
    'vendedor',
    'caminhoneiro',
    'mecanico'
]);

const escolaridades = new Set([
    'sem-instrucao',
    'fundamental-incompleto',
    'fundamental-completo',
    'medio-incompleto',
    'medio-completo',
    'superior-incompleto',
    'superior-completo'
]);

const modalidadesTrabalho = new Set([
    'presencial',
    'hibrido',
    'remoto'
]);

const idadesMinimas = {
    'ate-1': 18,
    'mais-1-ate-5': 20,
    'mais-5-ate-10': 24
};

export function calcularIdade(nascimento, hoje = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) {
        return null;
    }

    const [ano, mes, dia] = nascimento.split('-').map(Number);

    if (ano < 1 || mes < 1 || mes > 12 || dia < 1) {
        return null;
    }

    const bissexto =
        ano % 4 === 0 &&
        (ano % 100 !== 0 || ano % 400 === 0);

    const diasPorMes = [
        31,
        bissexto ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31
    ];

    if (dia > diasPorMes[mes - 1]) {
        return null;
    }

    const formatador = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const partes = Object.fromEntries(
        formatador.formatToParts(hoje).map((parte) => {
            return [parte.type, parte.value];
        })
    );

    const anoAtual = Number(partes.year);
    const mesAtual = Number(partes.month);
    const diaAtual = Number(partes.day);

    let idade = anoAtual - ano;

    if (
        mesAtual < mes ||
        (mesAtual === mes && diaAtual < dia)
    ) {
        idade--;
    }

    return idade;
}

export function validarCadastro(entrada) {
    const dados = {};
    const erros = {};

    const campos = [
        'nome',
        'sobrenome',
        'nascimento',
        'sexo',
        'estado',
        'profissao',
        'tempoEmprego',
        'escolaridade',
        'modalidadeTrabalho',
        'email',
        'celular',
        'usu',
        'sen'
    ];

    for (const campo of campos) {
        const valor = entrada[campo];

        if (typeof valor === 'string') {
            dados[campo] = campo === 'sen' ? valor : valor.trim();
        } else {
            dados[campo] = '';
        }

        if (!dados[campo]) {
            erros[campo] = 'Preencha este campo.';
        }
    }

    const limites = [
        ['nome', 30],
        ['sobrenome', 60]
    ];

    for (const [campo, limite] of limites) {
        if ([...dados[campo]].length > limite) {
            erros[campo] = `Utilize no máximo ${limite} caracteres.`;
        }
    }

    const idade = calcularIdade(dados.nascimento);

    if (idade === null) {
        erros.nascimento = 'Informe uma data válida.';
    } else if (idade < 0) {
        erros.nascimento = 'A data de nascimento não pode estar no futuro.';
    } else if (idade < 18) {
        erros.nascimento = 'É necessário ter pelo menos 18 anos completos.';
    }

    if (!['M', 'F'].includes(dados.sexo)) {
        erros.sexo = 'Selecione uma opção disponível.';
    }

    if (!estados.has(dados.estado)) {
        erros.estado = 'Selecione um estado disponível.';
    }

    if (!profissoes.has(dados.profissao)) {
        erros.profissao = 'Selecione uma profissão disponível.';
    }

    if (!Object.hasOwn(idadesMinimas, dados.tempoEmprego)) {
        erros.tempoEmprego = 'Selecione uma faixa disponível.';
    } else if (
        idade !== null &&
        idade < idadesMinimas[dados.tempoEmprego]
    ) {
        const idadeMinima = idadesMinimas[dados.tempoEmprego];

        erros.tempoEmprego =
            `Essa faixa exige pelo menos ${idadeMinima} anos nesta simulação.`;
    }

    if (!escolaridades.has(dados.escolaridade)) {
        erros.escolaridade = 'Selecione uma escolaridade disponível.';
    }

    if (!modalidadesTrabalho.has(dados.modalidadeTrabalho)) {
        erros.modalidadeTrabalho = 'Selecione uma modalidade disponível.';
    }

    dados.email = dados.email.toLowerCase();

    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        dados.email.length > 254 ||
        !formatoEmail.test(dados.email)
    ) {
        erros.email = 'Informe um e-mail válido.';
    }

    const formatoCelular =
        /^(?:\([0-9]{2}\) [0-9]{5}-[0-9]{4}|[0-9]{11})$/;

    if (!formatoCelular.test(dados.celular)) {
        erros.celular = 'Informe o DDD e os nove dígitos do celular.';
    }

    dados.celular = dados.celular.replace(/[^0-9]/g, '');

    dados.usu = dados.usu.toLowerCase();

    const formatoUsuario = /^[a-z0-9_.-]{6,18}$/;

    if (!formatoUsuario.test(dados.usu)) {
        erros.usu =
            'Use de 6 a 18 letras sem acento, números, pontos, hífens ou sublinhados.';
    }

    if (
        dados.sen.length < 8 ||
        dados.sen.length > 128 ||
        !dados.sen.trim()
    ) {
        erros.sen =
            'Use uma senha de 8 a 128 caracteres, sem utilizar apenas espaços.';
    }

    return { dados, erros };
}