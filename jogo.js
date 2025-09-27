// jogo.js - arquivo completo e comentado para fins acadêmicos

// Garante que todo o DOM esteja carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Seleção dos elementos principais do DOM
    const grid = document.getElementById('grid'); // tabuleiro do jogo
    const gameOverModal = document.getElementById('gameOverModal'); // modal de fim de jogo
    const gameOverMessage = document.getElementById('gameOverMessage'); // mensagem dentro do modal
    const restartButton = document.getElementById('restartButton'); // botão de reiniciar o jogo
    
    const difficultyCard = document.getElementById('difficultyCard'); // card para selecionar dificuldade
    const difficultyButtons = document.getElementById('difficultyButtons'); // container dos botões de dificuldade
    const gameElements = [grid, document.getElementById('timerCard'), document.getElementById('playersCard')]; 
    // elementos do jogo que ficam ocultos até a escolha da dificuldade

    const timeDisplay = document.getElementById('timeDisplay'); // display do tempo decorrido
    
    // --- Players ---
    const p1NameEl = document.getElementById("p1Name"); // elemento que mostra o nome do jogador 1
    const p2NameEl = document.getElementById("p2Name"); // elemento que mostra o nome do jogador 2
    const p1ScoreEl = document.getElementById("p1Score"); // elemento que mostra a pontuação do jogador 1
    const p2ScoreEl = document.getElementById("p2Score"); // elemento que mostra a pontuação do jogador 2
    const currentTurnEl = document.getElementById("currentTurn"); // elemento que mostra o jogador da vez

    // Recupera nomes salvos no localStorage ou usa nomes padrões
    const player1 = localStorage.getItem("player1") || "Player 1";
    const player2 = localStorage.getItem("player2") || "Player 2";
    
    let p1Score = 0; // pontuação inicial do jogador 1
    let p2Score = 0; // pontuação inicial do jogador 2
    let currentPlayer = 1; // 1 = jogador 1, 2 = jogador 2

    // Atualiza elementos do DOM com os nomes e jogador atual
    p1NameEl.textContent = player1;
    p2NameEl.textContent = player2;
    currentTurnEl.textContent = player1;

    // --- Variáveis do jogo ---
    let startTime; // timestamp do início do jogo
    let timerInterval; // referência do setInterval do temporizador
    let elapsedTime = 0; // tempo decorrido em milissegundos

    // Emojis disponíveis para as cartas
    const availableEmojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐼', '🐸', '🐵', '🐯', '🐻', '🦁', '🐨'];
    
    let currentDifficultySize = 0; // número de pares baseado na dificuldade
    let gameCards = []; // array das cartas do jogo

    // Variáveis para controle de virada das cartas
    let hasFlippedCard = false; 
    let lockBoard = false; // impede ações enquanto duas cartas estão viradas
    let firstCard = null, secondCard = null; // referência das cartas viradas
    let matchedPairs = 0; // número de pares encontrados
    let totalMoves = 0; // contador de movimentos feitos

    // --- Temporizador ---
    function startTimer() {
        if (timerInterval) return; // evita múltiplos timers
        startTime = Date.now() - elapsedTime; // calcula tempo inicial considerando tempo decorrido
        
        // Atualiza display a cada segundo
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimeDisplay();
        }, 1000); 
    }

    function stopTimer() {
        clearInterval(timerInterval); // para o temporizador
        timerInterval = null;
    }

    function updateTimeDisplay() {
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const formattedTime = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timeDisplay.textContent = formattedTime; // atualiza DOM com tempo formatado
    }

    // --- Configuração da dificuldade ---
    function setupGame(event) {
        const btn = event.target;
        const size = parseInt(btn.dataset.size); // recupera tamanho do botão
        if (isNaN(size)) return; 

        currentDifficultySize = size; // salva dificuldade escolhida
        
        difficultyCard.style.display = 'none'; // esconde escolha de dificuldade
        gameElements.forEach(el => el.classList.remove('hidden-game-element')); // mostra elementos do jogo
        
        grid.className = ''; 
        grid.classList.add('size-4x' + (size / 2)); // aplica classe CSS de acordo com dificuldade

        initializeGame(); // inicia o jogo
    }

    function initializeGame() {
        grid.innerHTML = ''; // limpa o grid
        matchedPairs = 0;
        totalMoves = 0;
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
        gameOverModal.style.display = 'none'; // esconde modal

        // reset placar e turno
        p1Score = 0;
        p2Score = 0;
        p1ScoreEl.textContent = 0;
        p2ScoreEl.textContent = 0;
        currentPlayer = 1;
        currentTurnEl.textContent = player1;

        // reset timer
        stopTimer();
        elapsedTime = 0;
        timeDisplay.textContent = '00:00'; 
        
        // selecionar emojis para a dificuldade escolhida
        const selectedEmojis = availableEmojis.slice(0, currentDifficultySize);
        gameCards = [...selectedEmojis, ...selectedEmojis]; // duplica emojis para criar pares
        
        shuffleCards(); // embaralha cartas
        createBoard(); // cria o tabuleiro
    }

    function shuffleCards() {
        // Algoritmo de Fisher-Yates para embaralhar o array de cartas
        for (let i = gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]; 
        }
    }

    function createBoard() {
        // Cria elementos DOM para cada carta
        gameCards.forEach((emoji) => {
            const card = document.createElement('div');
            card.classList.add('cartas');
            card.dataset.emoji = emoji; // guarda valor do emoji

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back">
                        <img src="logo.png" alt="Verso da Carta">
                    </div>
                    <div class="card-face card-front">${emoji}</div>
                </div>
            `;
            card.addEventListener('click', flipCard); // adiciona evento de clique
            grid.appendChild(card);
        });
    }

    // --- Lógica do jogo ---
    function flipCard() {
        if (lockBoard) return; // bloqueio de ações
        if (this === firstCard) return; // não permitir clicar na mesma carta
        if (this.classList.contains('flipped') || this.classList.contains('matched')) return; // já virada ou combinada

        // inicia o timer no primeiro movimento
        if (!timerInterval && totalMoves === 0 && matchedPairs === 0) {
            startTimer();
        }

        this.classList.add('flipped'); // vira a carta

        if (!hasFlippedCard) {
            // primeira carta virada
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        // segunda carta virada
        secondCard = this;
        totalMoves++;
        checkForMatch(); // verifica se as cartas combinam
    }

    function checkForMatch() {
        const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        if (isMatch) {
            handleMatch(); // acerto
        } else {
            handleMismatch(); // erro
        }
    }

    function handleMatch() {
        // remove possibilidade de clique
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);

        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++; // incrementa pares encontrados

        // atualiza placar do jogador da vez
        if (currentPlayer === 1) {
            p1Score++;
            p1ScoreEl.textContent = p1Score;
        } else {
            p2Score++;
            p2ScoreEl.textContent = p2Score;
        }

        resetBoard(); // reseta estado temporário
        checkGameOver(); // verifica fim do jogo
    }

    function handleMismatch() {
        lockBoard = true; // bloqueia ações enquanto cartas são viradas de volta

        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');

            // alterna turno
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            currentTurnEl.textContent = currentPlayer === 1 ? player1 : player2;

            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        // reset temporário para próxima jogada
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
    }

    function checkGameOver() {
        if (matchedPairs === currentDifficultySize) {
            stopTimer(); // para o timer
            showGameOverModal(); // mostra modal de fim de jogo
        }
    }

    function showGameOverModal() {
        const finalTime = timeDisplay.textContent;
        let winnerMsg;
        if (p1Score > p2Score) {
            winnerMsg = `${player1} venceu com ${p1Score} pontos! 🏆`;
        } else if (p2Score > p1Score) {
            winnerMsg = `${player2} venceu com ${p2Score} pontos! 🏆`;
        } else {
            winnerMsg = `Empate! Ambos fizeram ${p1Score} pontos 🤝`;
        }

        // atualiza conteúdo do modal
        gameOverMessage.textContent = `${winnerMsg} — Tempo: ${finalTime} — Movimentos: ${totalMoves}`;
        gameOverModal.style.display = 'flex'; // exibe modal
    }

    // --- Event Listeners ---
    // clique em dificuldade
    difficultyButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-difficulty');
        if (!btn) return;
        setupGame({ target: btn }); // inicia jogo com dificuldade escolhida
    });

    // reiniciar jogo pelo modal
    restartButton.addEventListener('click', () => {
        gameOverModal.style.display = 'none'; // esconde modal
        gameElements.forEach(el => el.classList.add('hidden-game-element')); // esconde elementos do jogo
        difficultyCard.style.display = 'block'; // mostra escolha de dificuldade
    });
});
