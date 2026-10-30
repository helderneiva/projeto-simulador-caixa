import { calcularNotas } from './saques.mjs';

function falhar(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;

    throw erro;
}

export async function consultarSessao(pool, tokenHash) {
    if (!tokenHash) {
        return null;
    }

    const consulta = await pool.query(
        `
            SELECT
                u.id,
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
                u.modalidade_trabalho,
                u.email,
                u.celular,
                c.id AS conta_id,
                c.saldo_centavos,
                c.notas_disponiveis,
                credito.valor_centavos AS credito_centavos,
                credito.detalhes AS credito_detalhes
            FROM sessoes s
            JOIN usuarios u
                ON u.id = s.usuario_id
            LEFT JOIN contas c
                ON c.usuario_id = u.id
            LEFT JOIN movimentacoes credito
                ON credito.conta_id = c.id
                AND credito.tipo = 'credito_inicial'
            WHERE s.token_hash = $1
                AND s.expira_em > CURRENT_TIMESTAMP
        `,
        [tokenHash]
    );

    const registro = consulta.rows[0];

    if (!registro) {
        return null;
    }

    if (!registro.conta_id) {
        falhar(503, 'Sua conta ainda não foi preparada.');
    }

    const {
        conta_id,
        saldo_centavos,
        notas_disponiveis,
        credito_centavos,
        credito_detalhes,
        ...usuario
    } = registro;

    return {
        usuario,
        conta: {
            id: String(conta_id),
            saldoCentavos: String(saldo_centavos),
            notasDisponiveis: notas_disponiveis,

            creditoInicial:
                credito_centavos === null
                    ? null
                    : {
                        valorCentavos: String(credito_centavos),
                        referencia:
                            credito_detalhes.referencia ?? null
                    }
        }
    };
}

function serializarMovimentacao(registro) {
    return {
        id: String(registro.id),
        tipo: registro.tipo,
        valorCentavos: String(registro.valor_centavos),
        saldoAposCentavos: String(registro.saldo_apos_centavos),
        criadoEm: registro.criado_em,
        detalhes: registro.detalhes
    };
}

export async function realizarSaque(pool, tokenHash, entrada) {
    if (!tokenHash) {
        falhar(401, 'Entre na sua conta para continuar.');
    }

    if (
        typeof entrada.valor !== 'string' ||
        !/^[1-9][0-9]{0,15}$/.test(entrada.valor)
    ) {
        falhar(
            422,
            'Informe um valor inteiro positivo, sem pontos ou vírgulas.'
        );
    }

    const reais = Number(entrada.valor);

    if (!Number.isSafeInteger(reais)) {
        falhar(422, 'Valor fora do limite permitido.');
    }

    const formatoChave =
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

    if (
        typeof entrada.chave !== 'string' ||
        !formatoChave.test(entrada.chave)
    ) {
        falhar(
            400,
            'Identificador de operação inválido. Atualize a página.'
        );
    }

    const centavos = BigInt(reais) * 100n;
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        const consulta = await cliente.query(
            `
                SELECT
                    c.id,
                    c.saldo_centavos,
                    c.notas_disponiveis,
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
                FROM sessoes s
                JOIN usuarios u
                    ON u.id = s.usuario_id
                JOIN contas c
                    ON c.usuario_id = u.id
                WHERE s.token_hash = $1
                    AND s.expira_em > CURRENT_TIMESTAMP
                FOR UPDATE OF c
            `,
            [tokenHash]
        );

        const conta = consulta.rows[0];

        if (!conta) {
            falhar(401, 'Sessão expirada. Entre novamente.');
        }

        const anterior = await cliente.query(
            `
                SELECT
                    id,
                    tipo,
                    valor_centavos,
                    saldo_apos_centavos,
                    criado_em,
                    detalhes
                FROM movimentacoes
                WHERE conta_id = $1
                    AND chave_operacao = $2
            `,
            [conta.id, entrada.chave]
        );

        if (anterior.rows[0]) {
            if (
                BigInt(anterior.rows[0].valor_centavos) !== centavos
            ) {
                falhar(
                    409,
                    'Esse identificador já foi usado em outro saque.'
                );
            }

            await cliente.query('COMMIT');

            return {
                movimentacao: serializarMovimentacao(
                    anterior.rows[0]
                ),
                repetido: true
            };
        }

        if (centavos > BigInt(conta.saldo_centavos)) {
            falhar(422, 'Saldo insuficiente.');
        }

        const distribuicao = calcularNotas(
            reais,
            conta.notas_disponiveis
        );

        if (!distribuicao) {
            falhar(
                422,
                'Esse valor não pode ser formado com as notas disponíveis.'
            );
        }

        const saldoApos =
            BigInt(conta.saldo_centavos) - centavos;

        const {
            id,
            saldo_centavos,
            notas_disponiveis,
            ...perfil
        } = conta;

        const detalhes = {
            notas: distribuicao.notas,
            quantidadeTotal: distribuicao.quantidadeTotal,
            notasDisponiveis: notas_disponiveis,
            perfil
        };

        await cliente.query(
            `
                UPDATE contas
                SET saldo_centavos = $1
                WHERE id = $2
            `,
            [String(saldoApos), id]
        );

        const insercao = await cliente.query(
            `
                INSERT INTO movimentacoes (
                    conta_id,
                    tipo,
                    valor_centavos,
                    saldo_apos_centavos,
                    chave_operacao,
                    detalhes
                )
                VALUES (
                    $1,
                    'saque',
                    $2,
                    $3,
                    $4,
                    $5::jsonb
                )
                RETURNING
                    id,
                    tipo,
                    valor_centavos,
                    saldo_apos_centavos,
                    criado_em,
                    detalhes
            `,
            [
                id,
                String(centavos),
                String(saldoApos),
                entrada.chave,
                JSON.stringify(detalhes)
            ]
        );

        await cliente.query('COMMIT');

        return {
            movimentacao: serializarMovimentacao(
                insercao.rows[0]
            ),
            repetido: false
        };
    } catch (erro) {
        try {
            await cliente.query('ROLLBACK');
        } catch {
            // Uma falha de conexão pode exigir nova consulta.
        }

        throw erro;
    } finally {
        cliente.release();
    }
}

function identificadorValido(valor) {
    return (
        typeof valor === 'string' &&
        /^[1-9][0-9]{0,18}$/.test(valor) &&
        BigInt(valor) <= 9223372036854775807n
    );
}

export async function consultarMovimentacao(pool, contaId, id) {
    if (!identificadorValido(id)) {
        falhar(400, 'Movimentação inválida.');
    }

    const consulta = await pool.query(
        `
            SELECT
                id,
                tipo,
                valor_centavos,
                saldo_apos_centavos,
                criado_em,
                detalhes
            FROM movimentacoes
            WHERE conta_id = $1
                AND id = $2
        `,
        [contaId, id]
    );

    if (!consulta.rows[0]) {
        falhar(404, 'Movimentação não encontrada.');
    }

    return serializarMovimentacao(consulta.rows[0]);
}

export async function consultarHistorico(pool, contaId, antes) {
    if (
        antes !== null &&
        !identificadorValido(antes)
    ) {
        falhar(400, 'Página inválida.');
    }

    const consulta = await pool.query(
        `
            SELECT
                id,
                tipo,
                valor_centavos,
                saldo_apos_centavos,
                criado_em,
                detalhes
            FROM movimentacoes
            WHERE conta_id = $1
                AND (
                    $2::bigint IS NULL
                    OR id < $2::bigint
                )
            ORDER BY id DESC
            LIMIT 21
        `,
        [contaId, antes]
    );

    const registros = consulta.rows.slice(0, 20);

    return {
        movimentacoes: registros.map(serializarMovimentacao),

        proximoCursor:
            consulta.rows.length > 20
                ? String(registros.at(-1).id)
                : null
    };
}