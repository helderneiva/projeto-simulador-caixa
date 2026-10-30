import { readFile } from 'node:fs/promises';

import { criarConexao } from './conexao.mjs';
import { prepararCreditos } from '../logica/credito.mjs';

let pool;

try {
    pool = criarConexao();

    const cliente = await pool.connect();

    try {
        const arquivos = [
            'estrutura.sql',
            'contas.sql',
            'notas.sql',
            'operacoes.sql'
        ];

        for (const arquivo of arquivos) {
            const sql = await readFile(
                new URL(arquivo, import.meta.url),
                'utf8'
            );

            await cliente.query(sql);
        }
    } catch (erro) {
        try {
            await cliente.query('ROLLBACK');
        } catch {
            // A conexão pode estar indisponível.
        }

        throw erro;
    } finally {
        cliente.release();
    }

    const resultado = await prepararCreditos(pool);

    console.log(
        'Estrutura completa do banco preparada.'
    );

    console.log(
        `Créditos iniciais aplicados: ${resultado.aplicados}.`
    );

    console.log(
        `Contas já creditadas e preservadas: ${resultado.preservados}.`
    );
} catch (erro) {
    console.error(
        erro.status === 409
            ? erro.message
            : 'Não foi possível preparar o banco. Confira DATABASE_URL e os arquivos do projeto.'
    );

    console.error(
        'Código:',
        erro.code ?? erro.status ?? 'CONFIGURACAO'
    );

    process.exitCode = 1;
} finally {
    if (pool) {
        await pool.end();
    }
}