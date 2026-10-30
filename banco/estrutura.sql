BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(30) NOT NULL
        CHECK (length(trim(nome)) > 0),

    sobrenome VARCHAR(60) NOT NULL
        CHECK (length(trim(sobrenome)) > 0),

    nascimento DATE NOT NULL,

    sexo CHAR(1) NOT NULL
        CHECK (sexo IN ('M', 'F')),

    estado CHAR(2) NOT NULL
        CHECK (
            estado IN (
                'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO',
                'AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE',
                'DF', 'GO', 'MT', 'MS',
                'ES', 'MG', 'RJ', 'SP',
                'PR', 'RS', 'SC'
            )
        ),

    profissao VARCHAR(40) NOT NULL
        CHECK (
            profissao IN (
                'professor',
                'veterinario',
                'advogado',
                'cabeleireiro',
                'cozinheiro',
                'enfermeiro',
                'designer-grafico',
                'farmaceutico',
                'programador',
                'analista-sistemas',
                'desenvolvedor-software',
                'vendedor',
                'caminhoneiro',
                'mecanico'
            )
        ),

    tempo_emprego VARCHAR(20) NOT NULL
        CHECK (
            tempo_emprego IN (
                'ate-1',
                'mais-1-ate-5',
                'mais-5-ate-10'
            )
        ),

    escolaridade VARCHAR(40) NOT NULL
        CHECK (
            escolaridade IN (
                'sem-instrucao',
                'fundamental-incompleto',
                'fundamental-completo',
                'medio-incompleto',
                'medio-completo',
                'superior-incompleto',
                'superior-completo'
            )
        ),

    modalidade_trabalho VARCHAR(15) NOT NULL
        CHECK (
            modalidade_trabalho IN (
                'presencial',
                'hibrido',
                'remoto'
            )
        ),

    email VARCHAR(254) NOT NULL,

    celular VARCHAR(11) NOT NULL
        CHECK (celular ~ '^[0-9]{11}$'),

    usuario VARCHAR(18) NOT NULL
        CHECK (usuario ~ '^[a-z0-9_.-]{6,18}$'),

    senha_hash TEXT NOT NULL,

    criado_em TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CHECK (email = lower(email)),

    CONSTRAINT usuarios_email_unico UNIQUE (email),
    CONSTRAINT usuarios_usuario_unico UNIQUE (usuario)
);

CREATE TABLE IF NOT EXISTS sessoes (
    token_hash CHAR(64) PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    criado_em TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    expira_em TIMESTAMPTZ NOT NULL,

    CHECK (expira_em > criado_em)
);

CREATE INDEX IF NOT EXISTS sessoes_expiracao
    ON sessoes (expira_em);

CREATE INDEX IF NOT EXISTS sessoes_usuario
    ON sessoes (usuario_id);

COMMIT;