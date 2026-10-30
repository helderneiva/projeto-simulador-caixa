import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { origem, registros } from './referencias-uf.mjs';

const minimoVinculos = 30;
const estados = new Set(Object.keys(registros.professor.territorios).filter(estado => estado !== 'BR'));
const escolaridades = new Set(['sem-instrucao', 'fundamental-incompleto', 'fundamental-completo', 'medio-incompleto', 'medio-completo', 'superior-incompleto', 'superior-completo']);
const tempos = new Set(['ate-1', 'mais-1-ate-5', 'mais-5-ate-10']);
const todasDimensoes = ['estado', 'escolaridade', 'tempoEmprego'];
const prioridades = [
    ['estado', 'escolaridade', 'tempoEmprego'],
    ['escolaridade', 'tempoEmprego'],
    ['estado', 'escolaridade'],
    ['estado', 'tempoEmprego'],
    ['escolaridade'],
    ['tempoEmprego'],
    ['estado'],
    []
];

function chave(registro) {
    return [registro.profissao, ...todasDimensoes.map(campo => registro[campo] ?? '')].join('|');
}

export function validarRecortes(entrada) {
    if (!Array.isArray(entrada) || entrada.length > 100000) {
        throw new Error('A base de referências deve conter uma lista de até 100000 recortes.');
    }

    const unicos = new Set();

    return entrada.map(item => {
        if (!item || typeof item !== 'object' || !Object.hasOwn(registros, item.profissao) || Number(item.anoBase) !== origem.anoBase) {
            throw new Error('Profissão ou ano de referência inválido.');
        }

        for (const [campo, permitidos] of [['estado', estados], ['escolaridade', escolaridades], ['tempoEmprego', tempos]]) {
            if (item[campo] !== null && !permitidos.has(item[campo])) {
                throw new Error(`Dimensão inválida: ${campo}. Use null para um recorte sem essa dimensão.`);
            }
        }

        const valor = String(item.valorCentavos);
        const vinculos = Number(item.vinculos);

        if (!/^[1-9][0-9]{0,14}$/.test(valor) || !Number.isSafeInteger(vinculos) || vinculos < 1) {
            throw new Error('Remuneração ou quantidade de vínculos inválida.');
        }

        const registro = {
            anoBase: origem.anoBase,
            profissao: item.profissao,
            estado: item.estado,
            escolaridade: item.escolaridade,
            tempoEmprego: item.tempoEmprego,
            valorCentavos: valor,
            vinculos
        };

        const identificador = chave(registro);
        if (unicos.has(identificador)) throw new Error('A base contém recortes duplicados.');
        unicos.add(identificador);
        return registro;
    });
}

function carregarRecortes() {
    try {
        const texto = readFileSync(new URL('../dados/referencias-perfil.json', import.meta.url), 'utf8');
        return validarRecortes(JSON.parse(texto));
    } catch (erro) {
        if (erro.code === 'ENOENT') return [];
        throw new Error('Base de referências do perfil inválida. Confira dados/referencias-perfil.json.', { cause: erro });
    }
}

const recortes = new Map(carregarRecortes().map(item => [chave(item), item]));

export function obterReferencia(entrada) {
    const perfil = typeof entrada === 'string' ? { profissao: entrada } : entrada;

    if (!perfil || !Object.hasOwn(registros, perfil.profissao)) {
        const erro = new Error('Referência salarial indisponível.');
        erro.status = 503;
        throw erro;
    }

    const registro = registros[perfil.profissao];
    const recusados = [];

    for (const dimensoes of prioridades) {
        if (dimensoes.some(campo => !perfil[campo])) continue;

        const filtro = { profissao: perfil.profissao };
        for (const campo of todasDimensoes) filtro[campo] = dimensoes.includes(campo) ? perfil[campo] : null;

        let selecionado = recortes.get(chave(filtro));
        let importado = Boolean(selecionado);

        if (!selecionado && (dimensoes.length === 0 || dimensoes.length === 1 && dimensoes[0] === 'estado')) {
            const territorio = registro.territorios[filtro.estado ?? 'BR'];
            if (territorio) selecionado = { valorCentavos: String(territorio[0]), vinculos: territorio[1] };
            importado = false;
        }

        if (!selecionado || selecionado.vinculos < minimoVinculos) {
            recusados.push({ criterios: [...dimensoes], motivo: selecionado ? 'menos-de-30-vinculos' : 'recorte-indisponivel' });
            continue;
        }

        const assinatura = createHash('sha256').update(JSON.stringify({ filtro, selecionado })).digest('hex');

        return {
            versao: `${importado ? 'rais-2025-perfil-v1' : origem.versao}:${assinatura.slice(0, 16)}`,
            anoBase: origem.anoBase,
            abrangencia: filtro.estado ?? 'Brasil',
            valorCentavos: selecionado.valorCentavos,
            vinculos: selecionado.vinculos,
            cbos: [...registro.cbos],
            fonte: importado ? 'RAIS / Base dos Dados' : origem.fonte,
            fontePrimaria: 'https://basedosdados.org/dataset/3e7c4d58-96ba-448e-b053-d385a829ef00',
            urlTabulacao: importado ? null : origem.url,
            metodo: importado ? 'Média do recorte conjunto, extraída dos microdados; sem multiplicadores.' : 'Média dos CBOs ponderada pela quantidade de vínculos; médias de origem arredondadas a centavos.',
            criteriosAplicados: ['profissao', ...dimensoes],
            criteriosNaoAplicados: [...todasDimensoes.filter(campo => !dimensoes.includes(campo)), 'idade', 'sexo', 'modalidadeTrabalho'],
            filtros: filtro,
            minimoVinculos,
            alternativasDescartadas: recusados,
            identificadorDados: importado ? assinatura : origem.sha256,
            consultadoEm: new Date().toISOString().slice(0, 10)
        };
    }

    const erro = new Error('Não há referência com a quantidade mínima de vínculos.');
    erro.status = 503;
    throw erro;
}