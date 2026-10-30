import pg from 'pg';

export function criarConexao() {
    if (!process.env.DATABASE_URL) {
        throw new Error(
            'Configure DATABASE_URL no arquivo .env ou no Render.'
        );
    }

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000
    });

    pool.on('error', function () {
        console.error(
            'Uma conexão ociosa com o banco foi interrompida.'
        );
    });

    return pool;
}