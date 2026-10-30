BEGIN;

ALTER TABLE movimentacoes
    ADD COLUMN IF NOT EXISTS chave_operacao UUID;

ALTER TABLE movimentacoes
    ADD COLUMN IF NOT EXISTS detalhes JSONB
    NOT NULL DEFAULT '{}'::JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS movimentacoes_chave_unica
    ON movimentacoes (conta_id, chave_operacao)
    WHERE chave_operacao IS NOT NULL;

COMMIT;