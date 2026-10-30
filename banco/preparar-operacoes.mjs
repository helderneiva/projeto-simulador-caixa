import { readFile } from 'node:fs/promises';
import { criarConexao } from './conexao.mjs';

let pool;
let cliente;

try {
    const sql = await readFile(
        new URL('./operacoes.sql', import.meta.url),
        'utf8'
    );

    pool = criarConexao();
    cliente = await pool.connect();

    await cliente.query(sql);

    console.log('Estrutura dos saques e extratos preparada.');
} catch (erro) {
    if (cliente) {
        try {
            await cliente.query('ROLLBACK');
        } catch {
            // A conexão pode estar indisponível.
        }
    }

    console.error(
        'Falha ao preparar operações. Código:',
        erro.code ?? 'INTERNO'
    );

    process.exitCode = 1;
} finally {
    cliente?.release();

    if (pool) {
        await pool.end();
    }
}