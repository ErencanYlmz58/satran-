// Main application for Romantic Chess
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game instances
    const chessGame = new ChessGame();
    const chessUI = new ChessUI(chessGame);
    
    // Initialize UI
    chessUI.init();
    
    // Start screen elements
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const startGameBtn = document.getElementById('startGameBtn');
    const gameIdInput = document.getElementById('gameId');
    const player1Btn = document.getElementById('player1');
    const player2Btn = document.getElementById('player2');
    
    // Player selection
    let selectedRole = 'light'; // Default to player 1 (light)
    
    player1Btn.addEventListener('click', () => {
        player1Btn.classList.add('active');
        player2Btn.classList.remove('active');
        selectedRole = 'light';
    });
    
    player2Btn.addEventListener('click', () => {
        player2Btn.classList.add('active');
        player1Btn.classList.remove('active');
        selectedRole = 'dark';
    });
    
    // Generate a random game ID if not provided
    function generateGameId() {
        return Math.random().toString(36).substring(2, 8);
    }
    
    // Start game button click
    startGameBtn.addEventListener('click', () => {
        let gameId = gameIdInput.value.trim();
        
        // If no game ID is provided, generate one
        if (!gameId) {
            gameId = generateGameId();
            gameIdInput.value = gameId;
        }
        
        // Initialize Firebase manager
        window.firebaseManager = new FirebaseManager(chessUI);
        window.firebaseManager.initGame(gameId, selectedRole);
        
        // Show game screen
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Display a romantic waiting message
        chessUI.setRomanticMessage(ROMANTIC_MESSAGES.WAITING[Math.floor(Math.random() * ROMANTIC_MESSAGES.WAITING.length)]);
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Esc key to deselect piece
        if (e.key === 'Escape' && chessGame.selectedPiece) {
            chessGame.selectedPiece = null;
            chessGame.validMoves = [];
            chessUI.renderBoard();
        }
    });
});