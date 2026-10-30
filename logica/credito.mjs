import { obterReferencia } from './referencias.mjs';

function falhar(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;

    throw erro;
}

async function transacionar(pool, executar) {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        const resultado = await executar(cliente);

        await cliente.query('COMMIT');

        return resultado;
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
}

async function creditarNoCliente(cliente, usuarioId) {
    const consulta = await cliente.query(
        `
            SELECT
                c.id AS conta_id,
                c.saldo_centavos,
                u.nome,
                u.sobrenome,
                u.usuario,
                to_char(
                    u.nascimento,
                    'YYYY-MM-DD'
                ) AS nascimento,
                u.sexo,
                u.estado,
                u.profissao,
                u.tempo_emprego,
                u.escolaridade,
                u.modalidade_trabalho
            FROM usuarios u
            JOIN contas c
                ON c.usuario_id = u.id
            WHERE u.id = $1
            FOR UPDATE OF c
        `,
        [usuarioId]
    );

    const conta = consulta.rows[0];

    if (!conta) {
        falhar(503, 'Conta não preparada.');
    }

    const anterior = await cliente.query(
        `
            SELECT id
            FROM movimentacoes
            WHERE conta_id = $1
                AND tipo = 'credito_inicial'
        `,
        [conta.conta_id]
    );

    if (anterior.rows[0]) {
        return false;
    }

    const historico = await cliente.query(
        `
            SELECT id
            FROM movimentacoes
            WHERE conta_id = $1
            LIMIT 1
        `,
        [conta.conta_id]
    );

    if (
        BigInt(conta.saldo_centavos) !== 0n ||
        historico.rows[0]
    ) {
        falhar(
            409,
            'Há uma conta com saldo ou movimentações sem crédito inicial registrado. Revise essa conta antes de aplicar o crédito.'
        );
    }

    const referencia = obterReferencia({
        profissao: conta.profissao,
        estado: conta.estado,
        escolaridade: conta.escolaridade,
        tempoEmprego: conta.tempo_emprego
    });

    const {
        conta_id,
        saldo_centavos,
        ...perfil
    } = conta;

    const detalhes = {
        referencia,
        perfil
    };

    await cliente.query(
        `
            UPDATE contas
            SET saldo_centavos = $1
            WHERE id = $2
        `,
        [referencia.valorCentavos, conta_id]
    );

    await cliente.query(
        `
            INSERT INTO movimentacoes (
                conta_id,
                tipo,
                valor_centavos,
                saldo_apos_centavos,
                detalhes
            )
            VALUES (
                $1,
                'credito_inicial',
                $2,
                $2,
                $3::jsonb
            )
        `,
        [
            conta_id,
            referencia.valorCentavos,
            JSON.stringify(detalhes)
        ]
    );

    return true;
}

export async function cadastrarUsuario(pool, dados, senhaHash) {
    return transacionar(pool, async cliente => {
        const consulta = await cliente.query(
            `
                INSERT INTO usuarios (
                    nome,
                    sobrenome,
                    nascimento,
                    sexo,
                    estado,
                    profissao,
                    tempo_emprego,
                    escolaridade,
                    modalidade_trabalho,
                    email,
                    celular,
                    usuario,
                    senha_hash
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11, $12, $13
                )
                RETURNING id
            `,
            [
                dados.nome,
                dados.sobrenome,
                dados.nascimento,
                dados.sexo,
                dados.estado,
                dados.profissao,
                dados.tempoEmprego,
                dados.escolaridade,
                dados.modalidadeTrabalho,
                dados.email,
                dados.celular,
                dados.usu,
                senhaHash
            ]
        );

        const usuarioId = consulta.rows[0].id;

        await cliente.query(
            `
                INSERT INTO contas (usuario_id)
                VALUES ($1)
            `,
            [usuarioId]
        );

        await creditarNoCliente(cliente, usuarioId);
    });
}

export async function prepararCreditos(pool) {
    const consulta = await pool.query(
        `
            SELECT usuario_id
            FROM contas
            ORDER BY id
        `
    );

    let aplicados = 0;
    let preservados = 0;

    for (const conta of consulta.rows) {
        const aplicado = await transacionar(
            pool,
            cliente => {
                return creditarNoCliente(
                    cliente,
                    conta.usuario_id
                );
            }
        );

        if (aplicado) {
            aplicados++;
        } else {
            preservados++;
        }
    }

    return {
        aplicados,
        preservados
    };
}