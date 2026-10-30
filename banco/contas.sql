BEGIN;

CREATE TABLE IF NOT EXISTS contas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL UNIQUE
        REFERENCES usuarios (id)
        ON DELETE CASCADE,

    saldo_centavos BIGINT NOT NULL DEFAULT 0
        CHECK (saldo_centavos >= 0),

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    conta_id BIGINT NOT NULL
        REFERENCES contas (id)
        ON DELETE CASCADE,

    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('credito_inicial', 'saque')),

    valor_centavos BIGINT NOT NULL
        CHECK (valor_centavos > 0),

    saldo_apos_centavos BIGINT NOT NULL
        CHECK (saldo_apos_centavos >= 0),

    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS movimentacoes_conta_data_idx
    ON movimentacoes (conta_id, criado_em DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS movimentacoes_credito_inicial_unico
    ON movimentacoes (conta_id)
    WHERE tipo = 'credito_inicial';

INSERT INTO contas (usuario_id)
SELECT id
FROM usuarios
ON CONFLICT (usuario_id) DO NOTHING;

COMMIT;