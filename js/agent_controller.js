const { Chess } = require('chess.js')
const { Controller } = require('./js/board_controller.js')


let game = Chess()


class RandomAgent {
    findMove = function (game) {
        const moves = game.moves()
        return randomMove(moves)
    }
}

function randomMove (moves) {
    return moves[Math.floor(Math.random() * moves.length)]
}

function filterMoves (moves, filter) {
    let newMoves = []
    for (let i = 0; i < moves.length; i++) {
        let move = moves[i]
        if (filter(move)) {
            newMoves.push(move)
        }
    }
    return newMoves
}

class MinimizeYourMovesAgent {

    findMove = function(game) {

        let bestMove
        let leastMoves = 500
        const moves = game.moves()
        for (let i = 0; i < moves.length; i++) {
            let move = moves[i]
            game.move(move)

            let moveScore = game.moves().length
            if (game.in_draw()) {
                moveScore = 10
            }

            if (moveScore < leastMoves) {
                bestMove = move
                leastMoves = moveScore
            }

            game.undo()
        }

        return bestMove
    }
}

class SmartRandomAgent {
    findMove = function (game) {
        const moves = game.moves({ verbose: true })

        let captures = filterMoves(moves, (m) => {
            return m.flags.includes('c')
        })

        // If there's nothing to capture, just return a random move
        if (captures.length === 0) {
            return moves[Math.floor(Math.random() * moves.length)]
        }

        // Otherwise evaluate the chessboard state of every next move and pick the move with the highest value
        let best
        let bestValue = -999
        for (let i = 0; i < captures.length; i++) {
            const move = captures[i]

            const my_move = (game.turn() === this.color)

            game.move(move)

            let v = -999
            if (game.in_checkmate() && my_move) {
                best = move
                break
            }

            if (game.in_draw()) {
                v = -100
            } else if (game.in_checkmate()) {
                v = -900
            } else {
                v = board_evaluate_material(game.board())
            }

            if (v > bestValue) {
                best = move
                bestValue = v
            }
            game.undo()
        }
        return best
    }
}

class BruteAgent {
    findMoveValue (game, depth) {
        const moves = game.moves()

        let best
        let bestValue = -999999
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i]
            game.move(move)

            let value = -999
            if (depth === 1) {
                value = board_evaluate_material_win(game)
            } else {
                value = this.findMoveValue(game, depth - 1)
            }

            if (value > bestValue) {
                best = move
                bestValue = value
            }

            game.undo()
        }

        console.log(depth + ': ' + bestValue)

        return best
    }

    findMove = (game) => {
        const best = this.findMoveValue(game, 3)
        if (best == null) {
            console.log('null result')
        }
        return this.findMoveValue(game, 3)
    }

}

class MiniMaxAgent {
    positionCount;

    minimaxRoot (depth, game, isMaximisingPlayer) {
        console.log("Starting minimax search...")
        const newGameMoves = game.moves()
        let bestMove = -9999
        let bestMoveFound

        for (let i = 0; i < newGameMoves.length; i++) {
            const newGameMove = newGameMoves[i]
            game.move(newGameMove)
            const value = this.minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer)
            game.undo()
            if (value >= bestMove) {
                bestMove = value
                bestMoveFound = newGameMove
            }
        }


        return bestMoveFound
    };

    minimax(depth, game, alpha, beta, is_maximizing) {
        this.positionCount++
        if (depth === 0) {
            return -board_evaluate_material_win(game, game.board())
        }

        const new_moves = game.moves()

        if (is_maximizing) {
            let bestMove = -9999
            for (let i = 0; i < new_moves.length; i++) {
                game.move(new_moves[i])
                bestMove = Math.max(bestMove, this.minimax(depth - 1, game, alpha, beta, !is_maximizing))
                game.undo()
                alpha = Math.max(alpha, bestMove)
                if (beta <= alpha) {
                    return bestMove
                }
            }
            return bestMove
        } else {
            let bestMove = 9999
            for (let i = 0; i < new_moves.length; i++) {
                game.move(new_moves[i])
                bestMove = Math.min(bestMove, this.minimax(depth - 1, game, alpha, beta, !is_maximizing))
                game.undo()
                beta = Math.min(beta, bestMove)
                if (beta <= alpha) {
                    return bestMove
                }
            }
            return bestMove
        }
    }

    findMove = () => {
        return this.minimaxRoot(3, game, true);
    }
}

const board_evaluate_material_win = function (game, board) {
    let value = -100

    if (game.in_checkmate()) {
        value = 1000
    } else {
        value = board_evaluate_material(board)
    }

    return value
}

const board_evaluate_material = function (board) {
    let total = 0
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            total = total + getPieceValue(board[i][j], i, j)
        }
    }
    return total
}

const getPieceValue = function (piece, x, y) {
    if (piece === null) {
        return 0
    }
    const getAbsoluteValue = function (piece) {
        if (piece.type === 'p') {
            return 10
        } else if (piece.type === 'r') {
            return 50
        } else if (piece.type === 'n') {
            return 30
        } else if (piece.type === 'b') {
            return 30
        } else if (piece.type === 'q') {
            return 90
        } else if (piece.type === 'k') {
            return 900
        }
        throw 'Unknown piece type: ' + piece.type
    }

    const absoluteValue = getAbsoluteValue(piece)
    return piece.color === game.turn() ? absoluteValue : -absoluteValue
}

black = new MinimizeYourMovesAgent()
white = new SmartRandomAgent()

controller = Controller(game, black, white)
controller.nextStep()

