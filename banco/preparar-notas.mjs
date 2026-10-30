import { readFile } from 'node:fs/promises';

import { criarConexao } from './conexao.mjs';

let pool;
let cliente;

try {
    const estrutura = await readFile(
        new URL('./notas.sql', import.meta.url),
        'utf8'
    );

    pool = criarConexao();
    cliente = await pool.connect();

    await cliente.query(estrutura);

    console.log(
        'Denominações das contas preparadas com sucesso.'
    );

    console.log(
        'Notas permitidas: R$ 2, R$ 5, R$ 10, R$ 20, R$ 50, R$ 100 e R$ 200.'
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
        'Não foi possível preparar as denominações. Código:',
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