export const profissoes = {
    professor: 'Professor',
    veterinario: 'Veterinário',
    advogado: 'Advogado',
    cabeleireiro: 'Cabeleireiro',
    cozinheiro: 'Cozinheiro',
    enfermeiro: 'Enfermeiro',
    'designer-grafico': 'Designer gráfico',
    farmaceutico: 'Farmacêutico',
    programador: 'Programador',
    'analista-sistemas': 'Analista de sistemas',
    'desenvolvedor-software': 'Desenvolvedor de software',
    vendedor: 'Vendedor',
    caminhoneiro: 'Caminhoneiro',
    mecanico: 'Mecânico'
};

export const tempos = {
    'ate-1': 'Até 1 ano',
    'mais-1-ate-5': 'Mais de 1 até 5 anos',
    'mais-5-ate-10': 'Mais de 5 até 10 anos'
};

const escolaridades = {
    'sem-instrucao': 'Sem instrução formal',
    'fundamental-incompleto': 'Ensino fundamental incompleto',
    'fundamental-completo': 'Ensino fundamental completo',
    'medio-incompleto': 'Ensino médio incompleto',
    'medio-completo': 'Ensino médio completo',
    'superior-incompleto': 'Ensino superior incompleto',
    'superior-completo': 'Ensino superior completo'
};

const modalidades = {
    presencial: 'Presencial',
    hibrido: 'Híbrido',
    remoto: 'Remoto'
};

const moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const dataHora = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
});

export function dinheiro(valor) {
    if (typeof valor !== 'string' || !/^[0-9]+$/.test(valor)) {
        throw new Error('Valor inválido.');
    }

    const centavos = BigInt(valor);
    const fracao = String(centavos % 100n).padStart(2, '0');

    return moeda
        .formatToParts(centavos / 100n)
        .map((parte) => {
            return parte.type === 'fraction' ? fracao : parte.value;
        })
        .join('');
}

export function dataFormatada(valor) {
    return dataHora.format(new Date(valor));
}

export function calcularIdade(nascimento, agora = new Date()) {
    if (typeof nascimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) {
        return null;
    }

    const [ano, mes, dia] = nascimento.split('-').map(Number);
    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    const diasPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > diasPorMes[mes - 1]) {
        return null;
    }

    const partes = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(agora).map((parte) => [parte.type, parte.value]));

    const anoAtual = Number(partes.year);
    const mesAtual = Number(partes.month);
    const diaAtual = Number(partes.day);

    let idade = anoAtual - ano;

    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

    return idade < 0 ? null : idade;
}

export function preencherPerfil(lista, perfil) {
    const nascimento = perfil.nascimento.split('-').reverse().join('/');
    const idade = calcularIdade(perfil.nascimento);

    const campos = [
        ['Titular', `${perfil.nome} ${perfil.sobrenome}`],
        ['Usuário', perfil.usuario],
        ['Nascimento', nascimento],
        ['Idade', idade === null ? 'Não disponível' : `${idade} ${idade === 1 ? 'ano' : 'anos'}`],
        ['Sexo', perfil.sexo === 'M' ? 'Masculino' : 'Feminino'],
        ['Estado', perfil.estado],
        ['Profissão', profissoes[perfil.profissao]],
        ['Tempo no emprego', tempos[perfil.tempo_emprego]],
        ['Escolaridade', escolaridades[perfil.escolaridade]],
        ['Modalidade', modalidades[perfil.modalidade_trabalho]]
    ];

    const fragmento = document.createDocumentFragment();

    for (const [rotulo, valor] of campos) {
        const grupo = document.createElement('div');
        const termo = document.createElement('dt');
        const descricao = document.createElement('dd');

        termo.textContent = rotulo;
        descricao.textContent = valor;

        grupo.append(termo, descricao);
        fragmento.append(grupo);
    }

    lista.replaceChildren(fragmento);
}

export function redirecionarLogin() {
    window.location.replace('/login.html');
}

export function resumirCredito(credito) {
    if (!credito?.referencia) {
        return 'Crédito de abertura sem referência disponível.';
    }

    const referencia = credito.referencia;
    const nomes = { profissao: 'profissão', estado: 'estado', escolaridade: 'escolaridade', tempoEmprego: 'tempo no emprego' };
    const criterios = (referencia.criteriosAplicados ?? ['profissao']).map(campo => nomes[campo] ?? campo).join(', ');
    const abrangencia = referencia.abrangencia === 'Brasil' ? 'Brasil' : `UF ${referencia.abrangencia}`;
    const quantidade = Number.isSafeInteger(referencia.vinculos) ? ` ${referencia.vinculos.toLocaleString('pt-BR')} vínculos.` : '';

    return `Crédito inicial: ${dinheiro(credito.valorCentavos)}. RAIS ${referencia.anoBase} · ${abrangencia}. Critérios: ${criterios}.${quantidade}`;
}