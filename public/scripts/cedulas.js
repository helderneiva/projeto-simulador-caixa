const valores = new Set([2, 5, 10, 20, 50, 100, 200]);

export function criarImagemCedula(valor) {
    if (!valores.has(valor)) {
        throw new RangeError('Denominação indisponível.');
    }

    const quadro = document.createElement('div');
    quadro.className = 'quadro-cedula';

    const imagem = document.createElement('img');
    imagem.className = 'nota-imagem';
    imagem.src = `/imagens/notas/nota-${valor}.jpg`;
    imagem.alt = `Cédula de ${valor} reais`;
    imagem.loading = 'eager';
    imagem.decoding = 'async';

    const alternativa = document.createElement('span');
    alternativa.className = 'nota-fallback';
    alternativa.textContent = `R$ ${valor}`;
    alternativa.hidden = true;

    imagem.addEventListener('error', () => {
        imagem.hidden = true;
        alternativa.hidden = false;
    }, { once: true });

    quadro.append(imagem, alternativa);
    return quadro;
}