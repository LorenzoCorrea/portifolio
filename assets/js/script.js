// ============================================================
// 1. Hero — Terminal com efeito de digitação
// ============================================================
function initHeroTerminal() {
    const term = document.getElementById('terminal');
    if (!term) return;

    const nodes = Array.from(term.querySelectorAll('.term-cmd, .term-out'));

    // Guarda o texto dos comandos e zera para digitar do zero
    nodes.forEach(node => {
        if (node.classList.contains('term-cmd')) {
            node.dataset.text = node.textContent;
            node.textContent = '';
        }
    });

    function revealAll() {
        nodes.forEach(n => {
            if (n.classList.contains('term-cmd')) n.textContent = n.dataset.text;
            else n.classList.add('revealed');
        });
    }

    // Acessibilidade: sem animação para quem prefere movimento reduzido
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealAll();
        return;
    }

    // Failsafe: se algo travar, revela tudo
    const failsafe = setTimeout(revealAll, 7000);

    let i = 0;
    function step() {
        if (i >= nodes.length) { clearTimeout(failsafe); return; }
        const node = nodes[i];

        if (node.classList.contains('term-cmd')) {
            const text = node.dataset.text;
            let c = 0;
            (function type() {
                node.textContent = text.slice(0, c);
                if (c++ < text.length) {
                    setTimeout(type, 55);
                } else {
                    i++;
                    setTimeout(step, 280);
                }
            })();
        } else {
            node.classList.add('revealed');
            i++;
            setTimeout(step, 380);
        }
    }

    setTimeout(step, 250);
}

// ============================================================
// 2. Intro / Preloader — terminal "Seja bem-vindo(a)!" + chuva de 0 e 1
// ============================================================
function runIntro(onDone) {
    const intro = document.getElementById('intro');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Já viu a intro nesta sessão? (não repete em refresh / navegação)
    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem('introSeen') === '1'; } catch (e) {}

    // Sem overlay, movimento reduzido, ou já vista nesta sessão: pula direto
    if (!intro || prefersReduced || alreadySeen) {
        if (intro) intro.style.display = 'none';
        onDone();
        return;
    }

    // Marca como vista para não repetir nesta sessão
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}

    document.body.style.overflow = 'hidden'; // trava o scroll durante a intro

    let finished = false;
    let rafId = null;
    const timers = [];
    const after = (ms, fn) => { const id = setTimeout(() => { if (!finished) fn(); }, ms); timers.push(id); return id; };

    function cleanup() {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        if (rafId) cancelAnimationFrame(rafId);
        intro.removeEventListener('click', cleanup);
        window.removeEventListener('keydown', cleanup);
        intro.classList.add('intro-hide');
        document.body.style.overflow = '';
        setTimeout(() => { intro.remove(); }, 550);
        onDone(); // libera o hero enquanto o overlay faz fade-out
    }

    // Pulável: clique ou qualquer tecla encerra a intro
    intro.addEventListener('click', cleanup);
    window.addEventListener('keydown', cleanup);

    const cmdEl = document.getElementById('introCmd');
    const welEl = document.getElementById('introWelcome');

    function typeInto(el, text, speed, cb) {
        let c = 0;
        (function t() {
            if (finished) return;
            el.textContent = text.slice(0, c);
            if (c++ < text.length) after(speed, t);
            else if (cb) cb();
        })();
    }

    function startMatrix() {
        if (finished) return;
        const tEl = intro.querySelector('.intro-terminal');
        if (tEl) tEl.classList.add('intro-fade'); // some com o texto de boas-vindas
        intro.classList.add('show-matrix');

        const canvas = document.getElementById('matrix');
        const ctx = canvas.getContext('2d');
        const w = window.innerWidth, h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const fontSize = 16;
        const cols = Math.ceil(w / fontSize);
        const drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -25));
        ctx.font = fontSize + "px 'JetBrains Mono', monospace";

        let last = 0;
        function draw(ts) {
            if (finished) return;
            rafId = requestAnimationFrame(draw);
            if (ts - last < 33) return; // ~30fps, look "pixelado" clássico
            last = ts;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; // rastro que desvanece
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#22e06a'; // verde
            for (let i = 0; i < cols; i++) {
                ctx.fillText(Math.random() < 0.5 ? '0' : '1', i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > h && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }
        rafId = requestAnimationFrame(draw);

        after(1500, cleanup); // dura ~1.5s e revela o portfólio
    }

    // Sequência: digita o comando -> digita "Seja bem-vindo(a)!" -> chuva de 0/1
    typeInto(cmdEl, './welcome.sh', 45, () => {
        after(200, () => typeInto(welEl, 'Seja bem-vindo(a)!', 45, () => {
            after(450, startMatrix);
        }));
    });
}

// Inicia: intro primeiro, depois o terminal do hero
runIntro(initHeroTerminal);

// ============================================================
// 2. Dark / Light Mode
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Aplica a preferência salva ao carregar
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
}

// ============================================================
// 3. Carrossel de Projetos (contagem dinâmica)
// ============================================================
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentIndex = 0;

// Conta os cards reais no DOM — não precisa atualizar ao adicionar/remover projetos
const totalCards = track ? track.children.length : 0;

function updateCarousel() {
    if (!track) return;

    // 1 card por vez no mobile, 2 no desktop
    const cardsPerView = window.innerWidth < 768 ? 1 : 2;
    const maxIndex = Math.max(0, totalCards - cardsPerView);

    // Travas de segurança para o índice
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > maxIndex) currentIndex = maxIndex;

    // Calcula o deslocamento e aplica via CSS Transform
    const cardWidth = 100 / cardsPerView;
    const translateX = -(currentIndex * cardWidth);
    track.style.transform = `translateX(${translateX}%)`;

    // Desabilita/oculta os botões nos limites
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === maxIndex;
        prevBtn.style.opacity = currentIndex === 0 ? '0' : '1';
        nextBtn.style.opacity = currentIndex === maxIndex ? '0' : '1';
    }
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => { currentIndex--; updateCarousel(); });
    nextBtn.addEventListener('click', () => { currentIndex++; updateCarousel(); });
}

window.addEventListener('resize', updateCarousel);
updateCarousel();
