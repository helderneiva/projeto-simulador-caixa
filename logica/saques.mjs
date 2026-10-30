import { randomInt } from 'node:crypto';

const denominacoesDisponiveis = Object.freeze([
    2,
    5,
    10,
    20,
    50,
    100,
    200
]);

function validarNotas(notas) {
    if (
        !Array.isArray(notas) ||
        notas.length !== 4 ||
        new Set(notas).size !== 4 ||
        notas.some((nota) => {
            return !denominacoesDisponiveis.includes(nota);
        })
    ) {
        throw new TypeError(
            'Informe quatro denominações diferentes e disponíveis.'
        );
    }
}

function calcularMdc(a, b) {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a;
}

export function sortearNotas() {
    const notas = [...denominacoesDisponiveis];

    for (let indice = notas.length - 1; indice > 0; indice--) {
        const sorteado = randomInt(indice + 1);

        [notas[indice], notas[sorteado]] = [
            notas[sorteado],
            notas[indice]
        ];
    }

    return notas
        .slice(0, 4)
        .sort((a, b) => b - a);
}

export function calcularNotas(valor, notas) {
    if (!Number.isSafeInteger(valor) || valor <= 0) {
        throw new RangeError(
            'O valor do saque deve ser um número inteiro positivo dentro do limite seguro.'
        );
    }

    validarNotas(notas);

    const ordenadas = [...notas].sort((a, b) => b - a);

    const [maior, ...menores] = ordenadas;

    const quantidades = [];
    let melhor = null;

    function buscar(indice, restante, total) {
        const minimoPossivel =
            total + Math.ceil(restante / maior);

        if (
            melhor !== null &&
            minimoPossivel >= melhor.quantidadeTotal
        ) {
            return;
        }

        if (indice === menores.length) {
            if (restante % maior !== 0) {
                return;
            }

            const quantidadeMaior = restante / maior;

            const distribuicao = [
                {
                    valor: maior,
                    quantidade: quantidadeMaior
                },
                ...menores.map((nota, posicao) => {
                    return {
                        valor: nota,
                        quantidade: quantidades[posicao]
                    };
                })
            ].filter((nota) => nota.quantidade > 0);

            melhor = {
                valor,
                quantidadeTotal: total + quantidadeMaior,
                notas: distribuicao
            };

            return;
        }

        const nota = menores[indice];

        const limite = Math.min(
            Math.floor(restante / nota),
            maior / calcularMdc(maior, nota) - 1
        );

        for (
            let quantidade = 0;
            quantidade <= limite;
            quantidade++
        ) {
            quantidades[indice] = quantidade;

            buscar(
                indice + 1,
                restante - quantidade * nota,
                total + quantidade
            );
        }
    }

    buscar(0, valor, 0);

    return melhor;
}