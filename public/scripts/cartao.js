(() => {
    const cartao = document.querySelector('.cartao-bancario');

    if (!cartao) return;

    let descricao = document.getElementById('descricao-cartao');

    if (!descricao) {
        descricao = document.createElement('span');
        descricao.id = 'descricao-cartao';
        descricao.className = 'texto-acessivel';
        cartao.after(descricao);
    }

    const descricoes = (cartao.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => document.getElementById(id));
    cartao.setAttribute('aria-describedby', [...new Set([...descricoes, descricao.id])].join(' '));
    const nomeNoCartao = cartao.querySelector('[data-cartao-nome]');
    const profissaoNoCartao = cartao.querySelector('[data-cartao-profissao]');
    const nome = document.getElementById('nome');
    const sobrenome = document.getElementById('sobrenome');
    const profissao = document.getElementById('profissao');
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ponteiroPreciso = window.matchMedia('(hover: hover) and (pointer: fine)');
    let virado = false;
    let quadro = 0;
    let girando = false;
    let temporizador = 0;
    const rotacao = cartao.querySelector('.cartao-rotacao');

    function descreverCartao() {
        const conteudo = virado ? profissaoNoCartao.textContent : nomeNoCartao.textContent;
        descricao.textContent = `${virado ? 'Verso' : 'Frente'} do cartão de demonstração. ${conteudo}. Conta virtual com valores fictícios.`;
    }

    function atualizarPersonagem() {
        if (nome && sobrenome) {
            const nomeCompleto = [nome.value.trim(), sobrenome.value.trim()].filter(Boolean).join(' ');
            nomeNoCartao.textContent = nomeCompleto || 'Seu nome aqui';
        }

        if (profissao) {
            profissaoNoCartao.textContent = profissao.value ? profissao.selectedOptions[0].textContent : 'Sua trajetória começa aqui';
        }

        descreverCartao();
    }

    function repousarCartao() {
        cancelAnimationFrame(quadro);
        quadro = 0;
        cartao.classList.remove('inclinando');
        cartao.style.removeProperty('--inclinacao-x');
        cartao.style.removeProperty('--inclinacao-y');
        cartao.style.removeProperty('--luz-x');
        cartao.style.removeProperty('--luz-y');
    }

    function concluirGiro() {
        clearTimeout(temporizador);
        temporizador = 0;
        girando = false;
        cartao.classList.remove('girando');
    }

    rotacao.addEventListener('animationend', (evento) => {
        if (evento.target === rotacao) concluirGiro();
    });

    rotacao.addEventListener('animationcancel', (evento) => {
        if (evento.target === rotacao) concluirGiro();
    });

    cartao.addEventListener('click', () => {
        if (girando) return;

        repousarCartao();
        virado = !virado;
        cartao.classList.toggle('virado', virado);
        cartao.setAttribute('aria-pressed', String(virado));
        descreverCartao();

        if (!reduzirMovimento.matches) {
            girando = true;
            cartao.classList.add('girando');
            temporizador = window.setTimeout(concluirGiro, 750);
        }
    });

    cartao.addEventListener('pointermove', (evento) => {
        if (girando || reduzirMovimento.matches || !ponteiroPreciso.matches || evento.pointerType !== 'mouse') return;

        const limites = cartao.getBoundingClientRect();
        if (!limites.width || !limites.height) return;

        const x = Math.max(0, Math.min(1, (evento.clientX - limites.left) / limites.width));
        const y = Math.max(0, Math.min(1, (evento.clientY - limites.top) / limites.height));
        cancelAnimationFrame(quadro);

        quadro = requestAnimationFrame(() => {
            cartao.classList.add('inclinando');
            cartao.style.setProperty('--inclinacao-x', `${(0.5 - y) * 12}deg`);
            cartao.style.setProperty('--inclinacao-y', `${(x - 0.5) * 12}deg`);
            cartao.style.setProperty('--luz-x', `${x * 100}%`);
            cartao.style.setProperty('--luz-y', `${y * 100}%`);
            quadro = 0;
        });
    });

    cartao.addEventListener('pointerleave', repousarCartao);
    cartao.addEventListener('pointercancel', repousarCartao);
    cartao.addEventListener('blur', repousarCartao);
    window.addEventListener('blur', repousarCartao);

    reduzirMovimento.addEventListener('change', () => {
        repousarCartao();
        if (reduzirMovimento.matches) concluirGiro();
    });

    ponteiroPreciso.addEventListener('change', repousarCartao);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            repousarCartao();
            concluirGiro();
        }
    });

    for (const campo of [nome, sobrenome, profissao]) {
        campo?.addEventListener('input', atualizarPersonagem);
        campo?.addEventListener('change', atualizarPersonagem);
    }

    document.getElementById('formulario-cadastro')?.addEventListener('reset', () => {
        requestAnimationFrame(atualizarPersonagem);
    });

    window.addEventListener('pageshow', () => {
        concluirGiro();
        repousarCartao();
        atualizarPersonagem();
    });

    atualizarPersonagem();
})();