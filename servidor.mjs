import { criarConexao } from './banco/conexao.mjs';
import { criarServidor } from './logica/aplicacao.mjs';

const porta = Number(process.env.PORT ?? 3000);
const producao = process.env.NODE_ENV === 'production';

const origemInformada =
    process.env.APP_ORIGIN ??
    (producao ? '' : `http://localhost:${porta}`);

let pool;

try {
    if (
        !Number.isInteger(porta) ||
        porta < 1 ||
        porta > 65535
    ) {
        throw new Error('PORT inválida.');
    }

    const url = new URL(origemInformada);

    if (
        !['http:', 'https:'].includes(url.protocol) ||
        (producao && url.protocol !== 'https:')
    ) {
        throw new Error(
            'APP_ORIGIN deve utilizar HTTPS em produção.'
        );
    }

    pool = criarConexao();

    await pool.query(
        'SELECT id FROM usuarios LIMIT 0'
    );

    await pool.query(
        'SELECT token_hash FROM sessoes LIMIT 0'
    );

    await pool.query(
        `
            SELECT
                id,
                usuario_id,
                saldo_centavos,
                notas_disponiveis
            FROM contas
            LIMIT 0
        `
    );

    await pool.query(
        `
            SELECT
                id,
                conta_id,
                tipo,
                valor_centavos,
                saldo_apos_centavos,
                chave_operacao,
                detalhes,
                criado_em
            FROM movimentacoes
            LIMIT 0
        `
    );

    const pendentes = await pool.query(
        `
            SELECT c.id
            FROM contas c
            WHERE NOT EXISTS (
                SELECT 1
                FROM movimentacoes m
                WHERE m.conta_id = c.id
                    AND m.tipo = 'credito_inicial'
            )
            LIMIT 1
        `
    );

    if (pendentes.rows.length > 0) {
        throw new Error(
            'Existem créditos iniciais pendentes.'
        );
    }

    const servidor = criarServidor(pool, {
        origem: url.origin,
        producao
    });

    servidor.on('error', erro => {
        console.error(
            'Não foi possível iniciar o servidor. Código:',
            erro.code
        );

        process.exitCode = 1;
        void pool.end();
    });

    servidor.listen(porta, '0.0.0.0', () => {
        console.log(`Abra ${url.origin}`);
    });

    for (const sinal of ['SIGINT', 'SIGTERM']) {
        process.once(sinal, () => {
            servidor.close(() => {
                void pool.end();
            });
        });
    }
} catch (erro) {
    console.error(
        'Confira PORT, APP_ORIGIN e DATABASE_URL e execute npm run banco:criar.'
    );

    console.error(
        'Código:',
        erro.code ?? 'CONFIGURACAO'
    );

    if (pool) {
        await pool.end();
    }

    process.exitCode = 1;
}