// User Interface handler for the Romantic Chess game
class ChessUI {
    constructor(game) {
        this.game = game;
        this.boardElement = document.getElementById('chessboard');
        this.gameStatusMessage = document.getElementById('gameStatusMessage');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.romanticMessage = document.getElementById('romanticMessage');
        this.lightCaptures = document.getElementById('lightCaptures');
        this.darkCaptures = document.getElementById('darkCaptures');
        this.playerRole = 'spectator'; // 'light', 'dark', or 'spectator'
        
        this.setupEventListeners();
    }
    
    // Initialize the UI
    init() {
        this.renderBoard();
        this.updateStatusMessages();
        this.updateCapturedPieces();
    }
    
    // Set the player's role
    setPlayerRole(role) {
        this.playerRole = role;
    }
    
    // Setup the board's event listeners
    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            this.handleSquareClick(row, col);
        });
        
        // Setup new game button
        document.getElementById('newGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to start a new game?')) {
                this.game.initialize();
                this.renderBoard();
                this.updateStatusMessages();
                this.updateCapturedPieces();
                // Notify Firebase about the new game
                if (window.firebaseManager) {
                    window.firebaseManager.updateGameState(this.game.getGameState());
                }
            }
        });
        
        // Setup exit game button
        document.getElementById('exitGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to exit this game?')) {
                // Show the start screen again
                document.getElementById('gameScreen').classList.add('hidden');
                document.getElementById('startScreen').classList.remove('hidden');
                
                // Disconnect from Firebase
                if (window.firebaseManager) {
                    window.firebaseManager.disconnect();
                }
            }
        });
    }
    
    // Handle square click
    handleSquareClick(row, col) {
        // Only allow moves if it's the player's turn
        if (this.game.currentPlayer !== this.playerRole && this.playerRole !== 'spectator') {
            this.showTemporaryMessage('Wait for your beloved to make their move...', 2000);
            return;
        }
        
        // If a piece is already selected
        if (this.game.selectedPiece) {
            const selectedRow = this.game.selectedPiece.row;
            const selectedCol = this.game.selectedPiece.col;
            
            // If clicking on the same square, deselect
            if (row === selectedRow && col === selectedCol) {
                this.game.selectedPiece = null;
                this.game.validMoves = [];
                this.renderBoard();
                return;
            }
            
            // Try to move the piece
            const moveResult = this.game.movePiece(selectedRow, selectedCol, row, col);
            
            if (moveResult && moveResult.success) {
                // Play move animation
                this.animateMove(selectedRow, selectedCol, row, col, moveResult);
                
                // Update the UI
                this.renderBoard();
                this.updateStatusMessages();
                this.updateCapturedPieces();
                
                // Display romantic message for the move
                this.displayRomanticMessage(moveResult);
                
                // Show checkmate modal if game is over
                if (moveResult.gameStatus === 'checkmate' || 
                    moveResult.gameStatus === 'stalemate' || 
                    moveResult.gameStatus === 'draw') {
                    this.showGameOverModal(moveResult.gameStatus);
                }
                
                // Notify Firebase about the move
                if (window.firebaseManager) {
                    window.firebaseManager.updateGameState(this.game.getGameState());
                }
                
                return;
            }
        }
        
        // If no piece is selected or invalid move, try to select a piece
        if (this.game.selectPiece(row, col)) {
            this.renderBoard();
        }
    }
    
    // Render the chessboard
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Highlight selected piece
                if (this.game.selectedPiece && 
                    this.game.selectedPiece.row === row && 
                    this.game.selectedPiece.col === col) {
                    square.classList.add('selected');
                }
                
                // Highlight valid moves
                if (this.game.validMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('valid-move');
                }
                
                // Highlight last move
                if (this.game.lastMove && 
                    ((this.game.lastMove.fromRow === row && this.game.lastMove.fromCol === col) || 
                     (this.game.lastMove.toRow === row && this.game.lastMove.toCol === col))) {
                    square.classList.add('last-move');
                }
                
                // Add piece if there is one
                const piece = this.game.getPiece(row, col);
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.innerHTML = PIECES[piece.type][piece.color];
                    pieceElement.title = `${PIECES[piece.type].name} (${piece.color === 'light' ? 'Light' : 'Dark'})`;
                    square.appendChild(pieceElement);
                }
                
                this.boardElement.appendChild(square);
            }
        }
    }
    
    // Update game status messages
    updateStatusMessages() {
        // Update turn indicator
        const currentPlayerName = this.game.currentPlayer === 'light' ? 'Light' : 'Dark';
        this.turnIndicator.textContent = `${currentPlayerName}'s turn`;
        
        // Update game status message
        switch (this.game.gameStatus) {
            case 'waiting':
                this.gameStatusMessage.textContent = 'Waiting for your beloved to join...';
                break;
            case 'active':
                this.gameStatusMessage.textContent = `The dance of love continues...`;
                break;
            case 'check':
                this.gameStatusMessage.textContent = `${currentPlayerName}'s Geliefde is in danger! (Check)`;
                break;
            case 'checkmate':
                const winner = this.game.currentPlayer === 'light' ? 'Dark' : 'Light';
                this.gameStatusMessage.textContent = `${winner} has won the heart of the battle!`;
                break;
            case 'stalemate':
                this.gameStatusMessage.textContent = 'The hearts are in perfect balance. (Stalemate)';
                break;
            case 'draw':
                this.gameStatusMessage.textContent = 'A passionate draw - neither heart could conquer the other.';
                break;
        }
    }
    
    // Update captured pieces display
    updateCapturedPieces() {
        this.lightCaptures.innerHTML = '';
        this.darkCaptures.innerHTML = '';
        
        this.game.capturedPieces.light.forEach(piece => {
            const capturedPiece = document.createElement('span');
            capturedPiece.className = 'captured-piece';
            capturedPiece.innerHTML = PIECES[piece.type][piece.color];
            capturedPiece.title = PIECES[piece.type].name;
            this.lightCaptures.appendChild(capturedPiece);
        });
        
        this.game.capturedPieces.dark.forEach(piece => {
            const capturedPiece = document.createElement('span');
            capturedPiece.className = 'captured-piece';
            capturedPiece.innerHTML = PIECES[piece.type][piece.color];
            capturedPiece.title = PIECES[piece.type].name;
            this.darkCaptures.appendChild(capturedPiece);
        });
    }
    
    // Display a romantic message based on the move
    displayRomanticMessage(moveResult) {
        let messageType = '';
        let piece = moveResult ? this.game.moveHistory[this.game.moveHistory.length - 1].piece : null;
        
        if (!piece) {
            // Default message if no piece (should not happen)
            this.setRomanticMessage(this.getRandomMessage('GAME_START'));
            return;
        }
        
        // Determine the message type based on the move result
        if (moveResult.gameStatus === 'checkmate') {
            messageType = 'CHECKMATE';
        } else if (moveResult.gameStatus === 'check') {
            messageType = 'CHECK';
        } else if (moveResult.gameStatus === 'stalemate' || moveResult.gameStatus === 'draw') {
            messageType = moveResult.gameStatus === 'stalemate' ? 'STALEMATE' : 'DRAW';
        } else if (moveResult.capturedPiece) {
            messageType = 'CAPTURE';
        } else if (moveResult.specialMove === 'castleKingSide' || moveResult.specialMove === 'castleQueenSide') {
            messageType = 'CASTLE';
        } else if (moveResult.specialMove === 'promotion') {
            messageType = 'PROMOTION';
        } else {
            // Regular move message based on the piece type
            messageType = piece.type;
        }
        
        // Get a random message for this type of move
        const message = this.getRandomMessage(messageType);
        this.setRomanticMessage(message);
        
        // Add floating hearts for captures or special moves
        if (messageType === 'CAPTURE' || messageType === 'CHECKMATE' || 
            messageType === 'PROMOTION' || messageType === 'CASTLE') {
            this.createHeartParticles(moveResult.toRow, moveResult.toCol);
        }
    }
    
    // Get a random message from the predefined messages
    getRandomMessage(type) {
        const messages = ROMANTIC_MESSAGES[type];
        if (!messages || messages.length === 0) {
            return "The game of love continues...";
        }
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // Set the romantic message with animation
    setRomanticMessage(message) {
        const messageElement = document.getElementById('romanticMessage');
        messageElement.innerHTML = `<p>${message}</p>`;
    }
    
    // Show a temporary message and then revert back
    showTemporaryMessage(message, duration) {
        const originalMessage = this.romanticMessage.innerHTML;
        this.setRomanticMessage(message);
        
        setTimeout(() => {
            this.romanticMessage.innerHTML = originalMessage;
        }, duration);
    }
    
    // Create floating heart particles
    createHeartParticles(row, col) {
        const square = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!square) return;
        
        const rect = square.getBoundingClientRect();
        
        // Create 5-10 floating hearts
        const numHearts = 5 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < numHearts; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerHTML = '❤️';
            heart.style.fontSize = `${20 + Math.random() * 15}px`;
            
            const startX = rect.left + (Math.random() * rect.width);
            const startY = rect.top + (Math.random() * rect.height);
            
            heart.style.left = `${startX}px`;
            heart.style.top = `${startY}px`;
            
            // Random rotation and delay
            heart.style.animationDelay = `${Math.random() * 0.5}s`;
            heart.style.animationDuration = `${1 + Math.random()}s`;
            
            document.body.appendChild(heart);
            
            // Remove the heart after animation
            setTimeout(() => {
                heart.remove();
            }, 2000);
        }
    }
    
    // Animate a piece moving from one square to another
    animateMove(fromRow, fromCol, toRow, toCol, moveResult) {
        // This is a simplified animation for now
        // Future enhancement: Add more elaborate animations
        this.createHeartParticles(toRow, toCol);
    }
    
    // Show game over modal
    showGameOverModal(gameStatus) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        let title, message;
        
        if (gameStatus === 'checkmate') {
            const winner = this.game.currentPlayer === 'light' ? 'Dark' : 'Light';
            title = 'Love Has Triumphed!';
            message = `${winner}'s passion has conquered the heart of the battlefield!`;
        } else if (gameStatus === 'stalemate') {
            title = 'Hearts in Balance';
            message = 'Neither heart could overcome the other. Your love remains in perfect harmony.';
        } else { // draw
            title = 'A Dance of Equals';
            message = 'Your hearts beat as one - this game of love ends in a beautiful draw.';
        }
        
        modal.innerHTML = `
            <h2>${title}</h2>
            <div class="hearts-container">❤️ ❤️ ❤️</div>
            <p>${message}</p>
            <button id="closeModalBtn" class="btn-primary">Continue Our Love Story</button>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            modalOverlay.remove();
        });
    }
    
    // Update the UI based on game state from Firebase
    updateFromGameState(gameState) {
        this.game.setGameState(gameState);
        this.renderBoard();
        this.updateStatusMessages();
        this.updateCapturedPieces();
        
        // Show romantic message for the last move if there's move history
        if (gameState.moveHistory && gameState.moveHistory.length > 0) {
            const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
            let messageType = '';
            
            if (gameState.gameStatus === 'checkmate') {
                messageType = 'CHECKMATE';
            } else if (gameState.gameStatus === 'check') {
                messageType = 'CHECK';
            } else if (gameState.gameStatus === 'stalemate' || gameState.gameStatus === 'draw') {
                messageType = gameState.gameStatus === 'stalemate' ? 'STALEMATE' : 'DRAW';
            } else if (lastMove.capturedPiece) {
                messageType = 'CAPTURE';
            } else if (lastMove.specialMove === 'castleKingSide' || lastMove.specialMove === 'castleQueenSide') {
                messageType = 'CASTLE';
            } else if (lastMove.specialMove === 'promotion') {
                messageType = 'PROMOTION';
            } else {
                // Regular move message based on the piece type
                messageType = lastMove.piece.type;
            }
            
            const message = this.getRandomMessage(messageType);
            this.setRomanticMessage(message);
        } else {
            // If no moves yet, show game start message
            this.setRomanticMessage(this.getRandomMessage('GAME_START'));
        }
        
        // Show game over modal if game is over
        if (gameState.gameStatus === 'checkmate' || 
            gameState.gameStatus === 'stalemate' || 
            gameState.gameStatus === 'draw') {
            this.showGameOverModal(gameState.gameStatus);
        }
    }
}