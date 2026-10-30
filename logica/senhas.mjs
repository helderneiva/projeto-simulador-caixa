import {
    randomBytes,
    scrypt,
    timingSafeEqual
} from 'node:crypto';

import { promisify } from 'node:util';

const derivar = promisify(scrypt);

const opcoes = {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024
};

let ocupado = false;

async function calcular(senha, salt) {
    if (ocupado) {
        const erro = new Error(
            'Tente novamente em alguns instantes.'
        );

        erro.status = 503;
        throw erro;
    }

    ocupado = true;

    try {
        return await derivar(
            senha,
            salt,
            64,
            opcoes
        );
    } finally {
        ocupado = false;
    }
}

export async function criarHash(senha) {
    const salt = randomBytes(16).toString('hex');
    const hash = await calcular(senha, salt);

    return `scrypt$131072$8$1$${salt}$${hash.toString('hex')}`;
}

export async function verificarSenha(senha, registro) {
    const partes = registro.split('$');

    if (
        partes.length !== 6 ||
        partes.slice(0, 4).join('$') !== 'scrypt$131072$8$1' ||
        !/^[a-f0-9]{32}$/.test(partes[4]) ||
        !/^[a-f0-9]{128}$/.test(partes[5])
    ) {
        return false;
    }

    const calculado = await calcular(senha, partes[4]);
    const armazenado = Buffer.from(partes[5], 'hex');

    return timingSafeEqual(calculado, armazenado);
}

export const hashFicticio =
    `scrypt$131072$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;