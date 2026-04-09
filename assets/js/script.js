// 1. Efeito Typewriter (Máquina de Escrever)
const textToType = "> FullStack_Dev_In_Training";
const typeWriterElement = document.getElementById('typewriter');
let i = 0;

function typeWriter() {
    if (i < textToType.length) {
        typeWriterElement.innerHTML += textToType.charAt(i);
        i++;
        setTimeout(typeWriter, 80);
    }
}
// Inicia o efeito após 500ms
setTimeout(typeWriter, 500);

// 2. Lógica do Dark Mode Toggle
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

// Verifica a preferência salva no LocalStorage ao carregar a página
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
}

// 3. Lógica do Carrossel de Projetos
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentIndex = 0;
const totalCards = 3; // Ajustado para os 3 projetos atuais

function updateCarousel() {
    // Exibe 1 card por vez no mobile, 2 no desktop
    const cardsPerView = window.innerWidth < 768 ? 1 : 2; 
    const maxIndex = totalCards - cardsPerView;
    
    // Travas de segurança para o índice
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > maxIndex) currentIndex = maxIndex;

    // Calcula o deslocamento e aplica via CSS Transform
    const cardWidth = 100 / cardsPerView; 
    const translateX = -(currentIndex * cardWidth);
    track.style.transform = `translateX(${translateX}%)`;

    // Desabilita/Oculta os botões quando chegar nos limites
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === maxIndex;
    prevBtn.style.opacity = currentIndex === 0 ? '0' : '1';
    nextBtn.style.opacity = currentIndex === maxIndex ? '0' : '1';
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => { 
        currentIndex--; 
        updateCarousel(); 
    });
    nextBtn.addEventListener('click', () => { 
        currentIndex++; 
        updateCarousel(); 
    });
}

// Atualiza o carrossel se o usuário redimensionar a janela
window.addEventListener('resize', updateCarousel);

// Chamada inicial para configurar o estado dos botões
updateCarousel();