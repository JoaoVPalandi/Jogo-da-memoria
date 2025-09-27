document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const gameOverModal = document.getElementById('gameOverModal');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');
    
    // NOVOS ELEMENTOS para Dificuldade e Elementos de Jogo
    const difficultyCard = document.getElementById('difficultyCard');
    const difficultyButtons = document.getElementById('difficultyButtons');
    const gameElements = [grid, document.getElementById('timerCard')]; // Elementos para mostrar/esconder

    const timeDisplay = document.getElementById('timeDisplay'); 
    let startTime;
    let timerInterval;
    let elapsedTime = 0;
    
    // Configurações de Dificuldade
    // Usaremos 12 emojis (6 pares) e pegaremos as fatias necessárias para cada nível
    const availableEmojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐼', '🐸', '🐵', '🐯', '🐻', '🦁', '🐨'];
    
    let currentDifficultySize = 0; // Número de pares (4, 6 ou 8)
    let gameCards = []; 

    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let matchedPairs = 0;
    let totalMoves = 0; 

    // --- Funções do Temporizador (Mantidas) ---

    function startTimer() {
        if (timerInterval) return; 
        startTime = Date.now() - elapsedTime; 
        
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimeDisplay();
        }, 1000); 
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function updateTimeDisplay() {
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const formattedTime = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timeDisplay.textContent = formattedTime;
    }

    // --- Funções de Início/Controle de Dificuldade ---

    function setupGame(event) {
        // Pega o tamanho da dificuldade do atributo data-size do botão
        const size = parseInt(event.target.dataset.size);
        if (isNaN(size)) return; // Sai se não for um botão de dificuldade

        currentDifficultySize = size;
        
        // Esconde o menu de dificuldade e mostra o grid/timer
        difficultyCard.style.display = 'none';
        gameElements.forEach(el => el.classList.remove('hidden-game-element'));
        
        // Define a classe de CSS para o tamanho correto do grid
        grid.className = ''; // Limpa classes antigas
        grid.classList.add('size-4x' + (size / 2)); // Ex: size-4x2, size-4x3, size-4x4

        initializeGame();
    }

    function initializeGame() {
        grid.innerHTML = '';
        matchedPairs = 0;
        totalMoves = 0;
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
        gameOverModal.style.display = 'none';

        // Reseta o temporizador
        stopTimer();
        elapsedTime = 0;
        timeDisplay.textContent = '00:00'; 
        
        // Seleciona apenas os emojis necessários para a dificuldade
        const selectedEmojis = availableEmojis.slice(0, currentDifficultySize);
        gameCards = [...selectedEmojis, ...selectedEmojis];
        
        shuffleCards(); 
        createBoard(); 
    }
    
    // O jogo só começa de fato após selecionar a dificuldade

    function shuffleCards() {
        for (let i = gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]; 
        }
    }

    function createBoard() {
        gameCards.forEach((emoji) => {
            const card = document.createElement('div');
            card.classList.add('cartas');
            card.dataset.emoji = emoji; 

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back">
                        <img src="logo.png" alt="Verso da Carta">
                    </div>
                    <div class="card-face card-front">${emoji}</div>
                </div>
            `;
            card.addEventListener('click', flipCard); 
            grid.appendChild(card);
        });
    }

    // --- Lógica do Jogo (Mantida) ---

    function flipCard() {
        if (lockBoard) return; 
        if (this === firstCard) return; 

        // Inicia o timer SOMENTE no primeiro clique do jogo
        if (totalMoves === 0 && !hasFlippedCard) {
            startTimer();
        }

        this.classList.add('flipped'); 

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        secondCard = this;
        totalMoves++; 
        checkForMatch(); 
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++;
        resetBoard(); 
        checkGameOver(); 
    }

    function unflipCards() {
        lockBoard = true; 

        setTimeout(() => {
            firstCard.classList.remove('flipped'); 
            secondCard.classList.remove('flipped'); 

            resetBoard(); 
        }, 1200); 
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false]; 
        [firstCard, secondCard] = [null, null]; 
    }

    function checkGameOver() {
        if (matchedPairs === currentDifficultySize) { // Usa a variável da dificuldade atual
            stopTimer(); 
            showGameOverModal();
        }
    }

    function showGameOverModal() {
        const finalTime = timeDisplay.textContent; 
        gameOverMessage.textContent = 
            `Você encontrou todos os ${currentDifficultySize} pares em ${totalMoves} movimentos e levou ${finalTime}! 🎉`;
        gameOverModal.style.display = 'flex'; 
    }

    // --- Event Listeners ---
    
    // Adiciona listener para os botões de dificuldade
    difficultyButtons.addEventListener('click', setupGame); 

    // O botão de reiniciar agora retorna ao menu de dificuldade para nova seleção
    restartButton.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        gameElements.forEach(el => el.classList.add('hidden-game-element'));
        difficultyCard.style.display = 'block';
    });

    // --- Início do Jogo ---
    
    // No início, mostramos apenas o card de dificuldade.
    // O initializeGame real é chamado dentro de setupGame.
});