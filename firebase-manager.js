// Firebase Manager for Romantic Chess
class FirebaseManager {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.database = firebase.database();
        this.gameRef = null;
        this.gameId = null;
        this.playerRole = null;
        this.playersRef = null;
        this.playersInRoom = {
            light: false,
            dark: false
        };
    }
    
    // Initialize Firebase connection with a game ID
    initGame(gameId, playerRole) {
        this.gameId = gameId;
        this.playerRole = playerRole;
        
        // Create or connect to the game reference
        this.gameRef = this.database.ref(`games/${gameId}`);
        this.playersRef = this.database.ref(`games/${gameId}/players`);
        
        // Listen for game state changes
        this.gameRef.child('gameState').on('value', (snapshot) => {
            const gameState = snapshot.val();
            if (gameState) {
                this.gameUI.updateFromGameState(gameState);
            }
        });
        
        // Listen for player connection changes
        this.playersRef.on('value', (snapshot) => {
            const players = snapshot.val() || {};
            this.playersInRoom = {
                light: players.light || false,
                dark: players.dark || false
            };
            
            this.updateGameStatus();
        });
        
        // Check if this is a new game
        this.gameRef.child('gameState').once('value', (snapshot) => {
            if (!snapshot.exists()) {
                // If no game state exists, initialize a new game
                this.updateGameState(this.gameUI.game.getGameState());
            }
        });
        
        // Register this player
        this.joinGame(playerRole);
        
        // Set up presence handling to detect disconnects
        this.setupPresence();
    }
    
    // Join the game with a specific role
    joinGame(role) {
        // Verify if the role is available
        this.playersRef.once('value', (snapshot) => {
            const players = snapshot.val() || {};
            
            if (players[role]) {
                // Role is already taken
                alert(`This role is already taken. Please choose another role or game room.`);
                return;
            }
            
            // Register player in this role
            this.playersRef.child(role).set(true);
            this.playerRole = role;
            this.gameUI.setPlayerRole(role);
            
            // Set up disconnect handling for this player
            const onDisconnectRef = this.playersRef.child(role).onDisconnect();
            onDisconnectRef.set(false);
        });
    }
    
    // Update game status based on players in room
    updateGameStatus() {
        const bothPlayersJoined = this.playersInRoom.light && this.playersInRoom.dark;
        
        if (bothPlayersJoined && this.gameUI.game.gameStatus === 'waiting') {
            // If both players have joined and game is waiting, start the game
            const gameState = this.gameUI.game.getGameState();
            gameState.gameStatus = 'active';
            this.updateGameState(gameState);
            
            // Display a message that both players have joined
            const message = this.getRandomMessage('PLAYER_JOINED');
            this.gameUI.setRomanticMessage(message);
        }
    }
    
    // Get a random message from predefined messages
    getRandomMessage(type) {
        const messages = ROMANTIC_MESSAGES[type];
        if (!messages || messages.length === 0) {
            return "The game of love continues...";
        }
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // Update the game state in Firebase
    updateGameState(gameState) {
        if (!this.gameRef) return;
        this.gameRef.child('gameState').set(gameState);
    }
    
    // Set up presence to handle disconnections
    setupPresence() {
        // Create a presence reference
        const presenceRef = this.database.ref('.info/connected');
        
        presenceRef.on('value', (snapshot) => {
            if (snapshot.val()) {
                // User is connected
                console.log('Connected to Firebase');
            } else {
                // User is disconnected
                console.log('Disconnected from Firebase');
            }
        });
    }
    
    // Disconnect from Firebase
    disconnect() {
        if (this.playersRef && this.playerRole) {
            // Remove this player from the game
            this.playersRef.child(this.playerRole).set(false);
        }
        
        // Clear all listeners
        if (this.gameRef) {
            this.gameRef.off();
        }
        
        if (this.playersRef) {
            this.playersRef.off();
        }
        
        this.gameRef = null;
        this.playersRef = null;
        this.gameId = null;
        this.playerRole = null;
    }
}