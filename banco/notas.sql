BEGIN;

CREATE OR REPLACE FUNCTION sortear_notas_conta()
RETURNS SMALLINT[]
LANGUAGE SQL
VOLATILE
AS $$
    SELECT array_agg(nota ORDER BY nota DESC)
    FROM (
        SELECT nota
        FROM unnest(
            ARRAY[2, 5, 10, 20, 50, 100, 200]::SMALLINT[]
        ) AS denominacoes(nota)
        ORDER BY random()
        LIMIT 4
    ) AS sorteadas;
$$;

ALTER TABLE contas
    ADD COLUMN IF NOT EXISTS notas_disponiveis SMALLINT[];

ALTER TABLE contas
    ALTER COLUMN notas_disponiveis
    SET DEFAULT sortear_notas_conta();

UPDATE contas
SET notas_disponiveis = sortear_notas_conta()
WHERE notas_disponiveis IS NULL;

ALTER TABLE contas
    ALTER COLUMN notas_disponiveis SET NOT NULL;

ALTER TABLE contas
    DROP CONSTRAINT IF EXISTS contas_notas_disponiveis_validas;

ALTER TABLE contas
    ADD CONSTRAINT contas_notas_disponiveis_validas
    CHECK (
        array_ndims(notas_disponiveis) = 1
        AND array_lower(notas_disponiveis, 1) = 1
        AND cardinality(notas_disponiveis) = 4
        AND array_position(notas_disponiveis, NULL) IS NULL
        AND notas_disponiveis <@
            ARRAY[2, 5, 10, 20, 50, 100, 200]::SMALLINT[]
        AND notas_disponiveis[1] > notas_disponiveis[2]
        AND notas_disponiveis[2] > notas_disponiveis[3]
        AND notas_disponiveis[3] > notas_disponiveis[4]
    );

COMMIT;