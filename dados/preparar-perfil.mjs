import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { registros, origem } from '../logica/referencias-uf.mjs';
import { validarRecortes } from '../logica/referencias.mjs';

function gerarConsulta() {
    const mapa = Object.entries(registros).flatMap(([profissao, registro]) => {
        return registro.cbos.map(cbo => `SELECT '${profissao}' AS profissao, '${cbo}' AS cbo`);
    }).join('\nUNION ALL\n');

    return `-- GoogleSQL / BigQuery. Confira o volume estimado antes de executar.
-- Referência: RAIS ${origem.anoBase}, vínculos ativos e remuneração positiva.
-- tempo_emprego: permanência no vínculo, em meses; não é experiência total.
WITH mapa AS (
${mapa}
), classificados AS (
    SELECT
        m.profissao,
        v.sigla_uf AS estado,
        CASE SAFE_CAST(v.grau_instrucao_apos_2005 AS INT64)
            WHEN 1 THEN 'sem-instrucao'
            WHEN 2 THEN 'fundamental-incompleto'
            WHEN 3 THEN 'fundamental-incompleto'
            WHEN 4 THEN 'fundamental-incompleto'
            WHEN 5 THEN 'fundamental-completo'
            WHEN 6 THEN 'medio-incompleto'
            WHEN 7 THEN 'medio-completo'
            WHEN 8 THEN 'superior-incompleto'
            WHEN 9 THEN 'superior-completo'
            WHEN 10 THEN 'superior-completo'
            WHEN 11 THEN 'superior-completo'
        END AS escolaridade,
        CASE
            WHEN v.tempo_emprego >= 0 AND v.tempo_emprego <= 12 THEN 'ate-1'
            WHEN v.tempo_emprego > 12 AND v.tempo_emprego <= 60 THEN 'mais-1-ate-5'
            WHEN v.tempo_emprego > 60 AND v.tempo_emprego <= 120 THEN 'mais-5-ate-10'
        END AS tempoEmprego,
        CAST(v.valor_remuneracao_media AS NUMERIC) AS remuneracao
    FROM \`basedosdados.br_me_rais.microdados_vinculos\` v
    JOIN mapa m ON m.cbo = v.cbo_2002
    JOIN \`basedosdados.br_bd_diretorios_brasil.municipio\` municipio
        ON municipio.id_municipio = v.id_municipio
    WHERE v.ano = ${origem.anoBase}
        AND v.vinculo_ativo_3112 = '1'
        AND v.valor_remuneracao_media > 0
), agregados AS (
    SELECT
        ${origem.anoBase} AS anoBase,
        profissao,
        estado,
        escolaridade,
        tempoEmprego,
        CAST(CAST(ROUND(AVG(remuneracao) * 100) AS INT64) AS STRING) AS valorCentavos,
        COUNT(*) AS vinculos
    FROM classificados
        GROUP BY GROUPING SETS (
        (profissao, estado, escolaridade, tempoEmprego),
        (profissao, escolaridade, tempoEmprego),
        (profissao, estado, escolaridade),
        (profissao, estado, tempoEmprego),
        (profissao, escolaridade),
        (profissao, tempoEmprego),
        (profissao, estado),
        (profissao)
    )
    HAVING (GROUPING(estado) = 1 OR estado IS NOT NULL)
        AND (GROUPING(escolaridade) = 1 OR escolaridade IS NOT NULL)
        AND (GROUPING(tempoEmprego) = 1 OR tempoEmprego IS NOT NULL)
        AND COUNT(*) >= 30
)
SELECT * FROM agregados
ORDER BY profissao, estado, escolaridade, tempoEmprego;
`;
}

async function importar(caminho) {
    if (!caminho) throw new Error('Informe o caminho do JSON exportado pelo BigQuery.');

    const texto = (await readFile(resolve(caminho), 'utf8')).replace(/^\uFEFF/, '').trim();
    const entrada = texto.startsWith('[') ? JSON.parse(texto) : texto.split(/\r?\n/).filter(Boolean).map(linha => JSON.parse(linha));
    const recortes = validarRecortes(entrada);

    for (const profissao of Object.keys(registros)) {
        if (!recortes.some(item => item.profissao === profissao && item.estado === null && item.escolaridade === null && item.tempoEmprego === null && item.vinculos >= 30)) {
            throw new Error(`A extração está incompleta: falta a referência nacional de ${profissao}.`);
        }
    }

    if (!recortes.some(item => item.escolaridade !== null && item.tempoEmprego !== null && item.vinculos >= 30)) {
        throw new Error('O arquivo não contém cruzamentos de escolaridade com tempo no emprego.');
    }

    const destino = new URL('./referencias-perfil.json', import.meta.url);
    const temporario = new URL(`./referencias-perfil.${process.pid}.tmp`, import.meta.url);
    await mkdir(new URL('./', import.meta.url), { recursive: true });

    try {
        await writeFile(temporario, JSON.stringify(recortes, null, 4) + '\n', { flag: 'wx' });
        await rename(temporario, destino);
    } finally {
        await unlink(temporario).catch(erro => {
            if (erro.code !== 'ENOENT') throw erro;
        });
    }

    console.log(`${recortes.length} recortes importados. Reinicie o servidor para usar a base nas novas contas.`);
}

try {
    const [acao, caminho] = process.argv.slice(2);

    if (acao === 'consulta') {
        await writeFile(new URL('./consulta-perfil.sql', import.meta.url), gerarConsulta(), 'utf8');
        console.log('Consulta criada em dados/consulta-perfil.sql.');
    } else if (acao === 'importar') {
        await importar(caminho);
    } else {
        throw new Error('Use: node dados/preparar-perfil.mjs consulta | importar caminho-do-arquivo.json');
    }
} catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
}