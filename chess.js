// Chess engine for Romantic Chess
class ChessGame {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Initialize game state
        this.board = this.createInitialBoard();
        this.currentPlayer = 'light'; // Light starts
        this.gameStatus = 'waiting'; // 'waiting', 'active', 'check', 'checkmate', 'stalemate', 'draw'
        this.selectedPiece = null;
        this.validMoves = [];
        this.capturedPieces = {
            light: [],
            dark: []
        };
        this.moveHistory = [];
        this.lastMove = null;
        this.kings = {
            light: { row: 7, col: 4 },
            dark: { row: 0, col: 4 }
        };
        this.castlingRights = {
            light: { kingSide: true, queenSide: true },
            dark: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
    }

    createInitialBoard() {
        // Create an 8x8 board with initial piece positions
        const board = Array(8).fill().map(() => Array(8).fill(null));

        // Set up pawns
        for (let col = 0; col < 8; col++) {
            board[1][col] = { type: 'PAWN', color: 'dark' };
            board[6][col] = { type: 'PAWN', color: 'light' };
        }

        // Set up other pieces
        const setupRow = (row, color) => {
            // Rooks
            board[row][0] = { type: 'ROOK', color };
            board[row][7] = { type: 'ROOK', color };
            
            // Knights
            board[row][1] = { type: 'KNIGHT', color };
            board[row][6] = { type: 'KNIGHT', color };
            
            // Bishops
            board[row][2] = { type: 'BISHOP', color };
            board[row][5] = { type: 'BISHOP', color };
            
            // Queen
            board[row][3] = { type: 'QUEEN', color };
            
            // King
            board[row][4] = { type: 'KING', color };
        };

        setupRow(0, 'dark');
        setupRow(7, 'light');

        return board;
    }

    // Get piece at specified position
    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    // Check if a square is empty
    isSquareEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }

    // Check if a square contains an enemy piece
    isEnemyPiece(row, col, playerColor) {
        const piece = this.getPiece(row, col);
        return piece !== null && piece.color !== playerColor;
    }

    // Select a piece and calculate its valid moves
    selectPiece(row, col) {
        const piece = this.getPiece(row, col);
        
        if (!piece || piece.color !== this.currentPlayer) {
            return false;
        }
        
        this.selectedPiece = { row, col, piece };
        this.validMoves = this.calculateValidMovesForPiece(row, col, piece);
        return true;
    }

    // Calculate all valid moves for a piece
    calculateValidMovesForPiece(row, col, piece) {
        let moves = [];
        
        switch (piece.type) {
            case 'PAWN':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'ROOK':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'KNIGHT':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'BISHOP':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'QUEEN':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'KING':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }
        
        // Filter moves that would leave the king in check
        return this.filterLegalMoves(row, col, piece, moves);
    }

    // Helper to check if a move would leave king in check
    filterLegalMoves(startRow, startCol, piece, moves) {
        return moves.filter(move => {
            // Make a temporary move
            const originalBoard = JSON.parse(JSON.stringify(this.board));
            const originalKings = JSON.parse(JSON.stringify(this.kings));
            
            // Execute the move temporarily
            const capturedPiece = this.board[move.row][move.col];
            this.board[move.row][move.col] = piece;
            this.board[startRow][startCol] = null;
            
            // Update king position if king moved
            if (piece.type === 'KING') {
                this.kings[piece.color] = { row: move.row, col: move.col };
            }
            
            // Check if the king is in check after this move
            const isInCheck = this.isKingInCheck(piece.color);
            
            // Restore the board
            this.board = originalBoard;
            this.kings = originalKings;
            
            // Return true if the move is legal (king not in check)
            return !isInCheck;
        });
    }

    // Get pawn moves
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'light' ? -1 : 1;
        const startRow = color === 'light' ? 6 : 1;
        
        // Forward move
        if (this.isSquareEmpty(row + direction, col)) {
            moves.push({ row: row + direction, col: col });
            
            // Double move from starting position
            if (row === startRow && this.isSquareEmpty(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col: col });
            }
        }
        
        // Capture moves
        const captureOffsets = [-1, 1];
        for (const offset of captureOffsets) {
            if (this.isEnemyPiece(row + direction, col + offset, color)) {
                moves.push({ row: row + direction, col: col + offset });
            }
            
            // En passant capture
            if (this.enPassantTarget && 
                this.enPassantTarget.row === row + direction && 
                this.enPassantTarget.col === col + offset) {
                moves.push({ 
                    row: row + direction, 
                    col: col + offset,
                    isEnPassant: true
                });
            }
        }
        
        return moves;
    }

    // Get rook moves
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.isSquareEmpty(r, c)) {
                    moves.push({ row: r, col: c });
                } else if (this.isEnemyPiece(r, c, color)) {
                    moves.push({ row: r, col: c });
                    break;
                } else {
                    break; // Blocked by own piece
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }

    // Get knight moves
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightOffsets = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        
        for (const offset of knightOffsets) {
            const r = row + offset.dr;
            const c = col + offset.dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.isSquareEmpty(r, c) || this.isEnemyPiece(r, c, color)) {
                    moves.push({ row: r, col: c });
                }
            }
        }
        
        return moves;
    }

    // Get bishop moves
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: -1 }, // Up-Left
            { dr: -1, dc: 1 },  // Up-Right
            { dr: 1, dc: -1 },  // Down-Left
            { dr: 1, dc: 1 }    // Down-Right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (this.isSquareEmpty(r, c)) {
                    moves.push({ row: r, col: c });
                } else if (this.isEnemyPiece(r, c, color)) {
                    moves.push({ row: r, col: c });
                    break;
                } else {
                    break; // Blocked by own piece
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }

    // Get queen moves (combination of rook and bishop)
    getQueenMoves(row, col, color) {
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }

    // Get king moves
    getKingMoves(row, col, color) {
        const moves = [];
        
        // Regular king moves in 8 directions
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue; // Skip current position
                
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (this.isSquareEmpty(r, c) || this.isEnemyPiece(r, c, color)) {
                        moves.push({ row: r, col: c });
                    }
                }
            }
        }
        
        // Castling moves
        if (this.canCastle(color, 'kingSide')) {
            moves.push({ row: row, col: col + 2, isCastling: 'kingSide' });
        }
        
        if (this.canCastle(color, 'queenSide')) {
            moves.push({ row: row, col: col - 2, isCastling: 'queenSide' });
        }
        
        return moves;
    }

    // Check if king can castle
    canCastle(color, side) {
        // Check if castling rights are still valid
        if (!this.castlingRights[color][side]) return false;
        
        // Check if king is in check
        if (this.isKingInCheck(color)) return false;
        
        const row = color === 'light' ? 7 : 0;
        const kingCol = 4;
        
        if (side === 'kingSide') {
            // Check if squares between king and rook are empty
            if (!this.isSquareEmpty(row, 5) || !this.isSquareEmpty(row, 6)) return false;
            
            // Check if rook is still in place
            const rookCol = 7;
            const rook = this.getPiece(row, rookCol);
            if (!rook || rook.type !== 'ROOK' || rook.color !== color) return false;
            
            // Check if king passes through check
            if (this.isSquareAttacked(row, 5, color)) return false;
            
            return true;
        } else { // queenSide
            // Check if squares between king and rook are empty
            if (!this.isSquareEmpty(row, 3) || !this.isSquareEmpty(row, 2) || !this.isSquareEmpty(row, 1)) return false;
            
            // Check if rook is still in place
            const rookCol = 0;
            const rook = this.getPiece(row, rookCol);
            if (!rook || rook.type !== 'ROOK' || rook.color !== color) return false;
            
            // Check if king passes through check
            if (this.isSquareAttacked(row, 3, color)) return false;
            
            return true;
        }
    }

    // Check if square is under attack by opposing pieces
    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'light' ? 'dark' : 'light';
        
        // Check for pawn attacks
        const pawnDirection = defendingColor === 'light' ? 1 : -1;
        const pawnAttackOffsets = [-1, 1]; // Left and right diagonal
        
        for (const offset of pawnAttackOffsets) {
            const r = row + pawnDirection;
            const c = col + offset;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                if (piece && piece.type === 'PAWN' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        // Check for knight attacks
        const knightOffsets = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        
        for (const offset of knightOffsets) {
            const r = row + offset.dr;
            const c = col + offset.dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                if (piece && piece.type === 'KNIGHT' && piece.color === attackingColor) {
                    return true;
                }
            }
        }
        
        // Check for attacks along straight lines (queen, rook)
        const straightDirections = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of straightDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                
                if (piece) {
                    if (piece.color === attackingColor && 
                        (piece.type === 'ROOK' || piece.type === 'QUEEN')) {
                        return true;
                    }
                    break; // Blocked by a piece
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check for attacks along diagonals (queen, bishop)
        const diagonalDirections = [
            { dr: -1, dc: -1 }, // Up-Left
            { dr: -1, dc: 1 },  // Up-Right
            { dr: 1, dc: -1 },  // Down-Left
            { dr: 1, dc: 1 }    // Down-Right
        ];
        
        for (const dir of diagonalDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                
                if (piece) {
                    if (piece.color === attackingColor && 
                        (piece.type === 'BISHOP' || piece.type === 'QUEEN')) {
                        return true;
                    }
                    break; // Blocked by a piece
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check for king attacks (one square in any direction)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const piece = this.getPiece(r, c);
                    if (piece && piece.type === 'KING' && piece.color === attackingColor) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Check if king is in check
    isKingInCheck(color) {
        const king = this.kings[color];
        return this.isSquareAttacked(king.row, king.col, color);
    }

    // Move a piece
    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // Check if the move is in the valid moves list
        const isValidMove = this.validMoves.some(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (!isValidMove) return false;
        
        // Find the specific move details
        const moveDetails = this.validMoves.find(move => 
            move.row === toRow && move.col === toCol
        );
        
        // Check for capture
        let capturedPiece = null;
        let captureType = 'normal';
        
        if (this.board[toRow][toCol]) {
            capturedPiece = this.board[toRow][toCol];
            this.capturedPieces[piece.color].push(capturedPiece);
            captureType = 'normal';
        } else if (moveDetails.isEnPassant) {
            // En passant capture
            const direction = piece.color === 'light' ? 1 : -1;
            capturedPiece = this.board[toRow + direction][toCol];
            this.board[toRow + direction][toCol] = null;
            this.capturedPieces[piece.color].push(capturedPiece);
            captureType = 'enPassant';
        }
        
        // Save the move
        this.lastMove = {
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            capturedPiece,
            captureType
        };
        
        // Execute the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Handle special moves
        let specialMove = 'none';
        
        // Castling
        if (piece.type === 'KING' && Math.abs(toCol - fromCol) === 2) {
            const isKingSide = toCol > fromCol;
            const rookFromCol = isKingSide ? 7 : 0;
            const rookToCol = isKingSide ? toCol - 1 : toCol + 1;
            
            // Move the rook
            const rook = this.board[fromRow][rookFromCol];
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
            
            specialMove = isKingSide ? 'castleKingSide' : 'castleQueenSide';
        }
        
        // Pawn promotion (automatically to Queen for now)
        if (piece.type === 'PAWN' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'QUEEN', color: piece.color };
            specialMove = 'promotion';
        }
        
        // Update en passant target
        this.enPassantTarget = null;
        if (piece.type === 'PAWN' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = { 
                row: (fromRow + toRow) / 2, 
                col: toCol 
            };
        }
        
        // Update castling rights
        if (piece.type === 'KING') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
            this.kings[piece.color] = { row: toRow, col: toCol };
        }
        
        if (piece.type === 'ROOK') {
            if (fromCol === 0) { // Queen side rook
                this.castlingRights[piece.color].queenSide = false;
            } else if (fromCol === 7) { // King side rook
                this.castlingRights[piece.color].kingSide = false;
            }
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'light' ? 'dark' : 'light';
        
        // Clear selection and valid moves
        this.selectedPiece = null;
        this.validMoves = [];
        
        // Add to move history
        this.moveHistory.push({
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            capturedPiece,
            specialMove
        });
        
        // Update game status
        this.updateGameStatus();
        
        return {
            success: true,
            capturedPiece,
            specialMove,
            gameStatus: this.gameStatus
        };
    }

    // Update game status (check, checkmate, stalemate, etc.)
    updateGameStatus() {
        const opponent = this.currentPlayer;
        const isInCheck = this.isKingInCheck(opponent);
        
        // Check if there are any legal moves for the current player
        const hasLegalMoves = this.hasAnyLegalMoves(opponent);
        
        if (isInCheck && !hasLegalMoves) {
            this.gameStatus = 'checkmate';
        } else if (!isInCheck && !hasLegalMoves) {
            this.gameStatus = 'stalemate';
        } else if (isInCheck) {
            this.gameStatus = 'check';
        } else {
            this.gameStatus = 'active';
        }
        
        // Check for insufficient material (simplified)
        if (this.hasInsufficientMaterial()) {
            this.gameStatus = 'draw';
        }
    }

    // Check if player has any legal moves
    hasAnyLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const moves = this.calculateValidMovesForPiece(row, col, piece);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Check for insufficient material (simplified)
    hasInsufficientMaterial() {
        let pieceCount = {
            light: { total: 0, knights: 0, bishops: 0 },
            dark: { total: 0, knights: 0, bishops: 0 }
        };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;
                
                pieceCount[piece.color].total++;
                
                if (piece.type === 'KNIGHT') {
                    pieceCount[piece.color].knights++;
                } else if (piece.type === 'BISHOP') {
                    pieceCount[piece.color].bishops++;
                }
            }
        }
        
        // King vs King
        if (pieceCount.light.total === 1 && pieceCount.dark.total === 1) {
            return true;
        }
        
        // King and Bishop vs King or King and Knight vs King
        if ((pieceCount.light.total === 1 && 
             pieceCount.dark.total === 2 && 
             (pieceCount.dark.bishops === 1 || pieceCount.dark.knights === 1)) ||
            (pieceCount.dark.total === 1 && 
             pieceCount.light.total === 2 && 
             (pieceCount.light.bishops === 1 || pieceCount.light.knights === 1))) {
            return true;
        }
        
        return false;
    }

    // Get game state for Firebase
    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameStatus: this.gameStatus,
            capturedPieces: this.capturedPieces,
            lastMove: this.lastMove,
            kings: this.kings,
            castlingRights: this.castlingRights,
            enPassantTarget: this.enPassantTarget,
            moveHistory: this.moveHistory
        };
    }

    // Set game state from Firebase
    setGameState(gameState) {
        this.board = gameState.board;
        this.currentPlayer = gameState.currentPlayer;
        this.gameStatus = gameState.gameStatus;
        this.capturedPieces = gameState.capturedPieces;
        this.lastMove = gameState.lastMove;
        this.kings = gameState.kings;
        this.castlingRights = gameState.castlingRights;
        this.enPassantTarget = gameState.enPassantTarget;
        this.moveHistory = gameState.moveHistory;
        
        // Clear selection and valid moves when receiving updated state
        this.selectedPiece = null;
        this.validMoves = [];
    }
}