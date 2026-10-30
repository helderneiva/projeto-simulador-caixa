import { readFile } from 'node:fs/promises';

import { criarConexao } from './conexao.mjs';

let pool;
let cliente;

try {
    const estrutura = await readFile(
        new URL('./contas.sql', import.meta.url),
        'utf8'
    );

    pool = criarConexao();
    cliente = await pool.connect();

    await cliente.query(estrutura);

    console.log(
        'Tabelas contas e movimentacoes criadas ou já existentes.'
    );

    console.log(
        'Contas dos usuários já cadastrados preparadas com saldo zero.'
    );
} catch (erro) {
    if (cliente) {
        try {
            await cliente.query('ROLLBACK');
        } catch {
            // A conexão pode estar indisponível.
        }
    }

    console.error(
        'Não foi possível preparar as contas. Código:',
        erro.code ?? 'INTERNO'
    );

    process.exitCode = 1;
} finally {
    if (cliente) {
        cliente.release();
    }

    if (pool) {
        await pool.end();
    }
}