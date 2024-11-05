const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const initialBoard = [
    'rnbqkbnr',
    'pppppppp',
    '........',
    '........',
    '........',
    '........',
    'PPPPPPPP',
    'RNBQKBNR'
];

const chessboard = document.getElementById('chessboard');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const closeModalButton = document.getElementById('close-modal');
let selectedSquare = null;
let board = initialBoard.map(row => row.split(''));
let currentPlayer = 'white';

closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
    resetGame();
});

function createBoard() {
    chessboard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            const piece = board[row][col];
            if (piece !== '.') {
                square.innerText = pieces[piece];
                square.classList.add(piece === piece.toUpperCase() ? 'white-piece' : 'black-piece');
            }
            square.addEventListener('click', () => selectSquare(square));
            chessboard.appendChild(square);
        }
    }
}

function selectSquare(square) {
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = board[row][col];

    if (selectedSquare) {
        clearHighlights();
        const selectedRow = parseInt(selectedSquare.dataset.row);
        const selectedCol = parseInt(selectedSquare.dataset.col);
        const selectedPiece = board[selectedRow][selectedCol];

        if (selectedSquare === square) {
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
        } else if (isValidMove(selectedPiece, selectedRow, selectedCol, row, col)) {
            movePiece(selectedRow, selectedCol, row, col);
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            if (currentPlayer === 'black') {
                setTimeout(makeBotMove, 500); // Delay for bot move
            }
        }
    } else if (piece !== '.' && isCurrentPlayerPiece(piece)) {
        selectedSquare = square;
        selectedSquare.classList.add('selected');
        highlightMoves(piece, row, col);
    }
}

function isCurrentPlayerPiece(piece) {
    return (currentPlayer === 'white' && piece === piece.toUpperCase()) ||
           (currentPlayer === 'black' && piece === piece.toLowerCase());
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    const targetPiece = board[toRow][toCol];
    if (targetPiece !== '.' && isCurrentPlayerPiece(targetPiece)) {
        return false;
    }

    switch (piece.toLowerCase()) {
        case 'p':
            return isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
        case 'r':
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'n':
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'b':
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'q':
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'k':
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

function isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const direction = piece === 'P' ? -1 : 1;
    const startRow = piece === 'P' ? 6 : 1;

    if (fromCol === toCol && board[toRow][toCol] === '.') {
        if (toRow === fromRow + direction) {
            return true;
        }
        if (fromRow === startRow && toRow === fromRow + 2 * direction && board[fromRow + direction][fromCol] === '.') {
            return true;
        }
    } else if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && board[toRow][toCol] !== '.') {
        return true;
    }

    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) {
        return false;
    }

    const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);

    for (let i = fromRow + rowStep, j = fromCol + colStep; i !== toRow || j !== toCol; i += rowStep, j += colStep) {
        if (board[i][j] !== '.') {
            return false;
        }
    }

    return true;
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) {
        return false;
    }

    const rowStep = toRow > fromRow ? 1 : -1;
    const colStep = toCol > fromCol ? 1 : -1;

    for (let i = fromRow + rowStep, j = fromCol + colStep; i !== toRow; i += rowStep, j += colStep) {
        if (board[i][j] !== '.') {
            return false;
        }
    }

    return true;
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return rowDiff <= 1 && colDiff <= 1;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = '.';
    createBoard();
    if (isCheckmate()) {
        showModal(`${currentPlayer === 'white' ? 'Black' : 'White'} wins by checkmate!`);
    }
}

function highlightMoves(piece, row, col) {
    for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(piece, row, col, toRow, toCol)) {
                const square = document.querySelector(`.square[data-row="${toRow}"][data-col="${toCol}"]`);
                square.classList.add('highlight');
            }
        }
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(square => {
        square.classList.remove('highlight');
    });
}

function makeBotMove() {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== '.' && piece === piece.toLowerCase()) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(piece, row, col, toRow, toCol)) {
                            moves.push({ fromRow: row, fromCol: col, toRow, toCol });
                        }
                    }
                }
            }
        }
    }

    if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
        currentPlayer = 'white';
    }
}



function findKing(player) {
    const king = player === 'white' ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === king) {
                return { row, col };
            }
        }
    }
    return null;
}

function generateMoves(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== '.' && (player === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(piece, row, col, toRow, toCol)) {
                            moves.push({ fromRow: row, fromCol: col, toRow, toCol });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function showModal(message) {
    modalText.textContent = message;
    modal.style.display = 'block';
}

function resetGame() {
    board = initialBoard.map(row => row.split(''));
    currentPlayer = 'white';
    createBoard();
}


function isCheckmate() {
    // If not in check, it's not checkmate
    if (!isInCheck(currentPlayer)) {
        return false;
    }

    // Try all possible moves to see if any can get out of check
    return !hasLegalMoves(currentPlayer);
}

function hasLegalMoves(player) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece !== '.' && 
                ((player === 'white' && piece === piece.toUpperCase()) ||
                 (player === 'black' && piece === piece.toLowerCase()))) {
                
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
                            // Try the move
                            const savedPiece = board[toRow][toCol];
                            const savedFromPiece = board[fromRow][fromCol];
                            board[toRow][toCol] = board[fromRow][fromCol];
                            board[fromRow][fromCol] = '.';

                            const stillInCheck = isInCheck(player);

                            // Undo the move
                            board[fromRow][fromCol] = savedFromPiece;
                            board[toRow][toCol] = savedPiece;

                            if (!stillInCheck) {
                                return true; // Found at least one legal move
                            }
                        }
                    }
                }
            }
        }
    }
    return false; // No legal moves found
}

function isInCheck(player) {
    const kingPos = findKing(player);
    if (!kingPos) return false;

    // Check if any opponent piece can capture the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== '.' && 
                ((player === 'white' && piece === piece.toLowerCase()) ||
                 (player === 'black' && piece === piece.toUpperCase()))) {
                
                if (isValidMove(piece, row, col, kingPos.row, kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findKing(player) {
    const kingPiece = player === 'white' ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === kingPiece) {
                return { row, col };
            }
        }
    }
    return null;
}

function movePiece(fromRow, fromCol, toRow, toCol) {
    // Store the current state
    const capturedPiece = board[toRow][toCol];
    const movingPiece = board[fromRow][fromCol];
    
    // Make the move
    board[toRow][toCol] = movingPiece;
    board[fromRow][fromCol] = '.';
    
    // Check if this move puts/leaves own king in check
    const playerColor = movingPiece === movingPiece.toUpperCase() ? 'white' : 'black';
    if (isInCheck(playerColor)) {
        // Undo the move if it leaves/puts the king in check
        board[fromRow][fromCol] = movingPiece;
        board[toRow][toCol] = capturedPiece;
        return false;
    }

    createBoard();
    
    // Check for checkmate on the opponent
    const opponent = playerColor === 'white' ? 'black' : 'white';
    if (isInCheck(opponent) && isCheckmate()) {
        showModal(`${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} wins by checkmate!`);
    }
    
    return true;
}

createBoard();