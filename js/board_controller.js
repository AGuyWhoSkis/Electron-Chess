//if (typeof exports !== 'undefined') exports.Chess = Chess

exports.Controller = (function (_game, _black_agent, _white_agent) {

    this.game = _game
    this.task = undefined

    console.log(JSON.stringify(this.game))
    console.log(this.game.turn())

    this.white_agent = _white_agent
    if (this.white_agent !== null) {
        this.white_agent.turn = 'w'
    }

    this.black_agent = _black_agent
    if (this.black_agent !== null) {
        this.black_agent.turn = 'b'
    }

    const updateStatus = () => {
        let status

        let moveColor = 'White'
        if (this.game.turn() === 'b') {
            moveColor = 'Black'
        }

        if (this.game.in_checkmate()) {
            status = 'Game over, ' + moveColor + ' is in checkmate.'
        } else if (this.game.in_draw()) {
            status = 'Game over, drawn position'
        }

        // game still on
        else {
            status = moveColor + ' to move'

            // check?
            if (this.game.in_check()) {
                status += ', ' + moveColor + ' is in check'
            }
        }

        setHTML('status', status)
        setHTML('fen', this.game.fen())
        setHTML('pgn', this.game.pgn())
    }

    const updateEvaluation = (color, evaluation) => {
        if (color !== null) {
            setHTML("eval" + color, evaluation)
        }
    }

    const setHTML = (id, newHTML) => {
        document.getElementById(id).innerHTML = newHTML
    }

    const nextStep = async (timeout = 500) => {
        await new Promise(r => setTimeout(r, timeout))
        step()
    }

    // TODO: Implement pausing
    const cancelNextStep = () => {
        if (this.task != null) {
            clearTimeout(this.task)
        }
    }

    const getAgent = (color) => {
        if (color === 'b') {
            return this.black_agent
        } else if (color === 'w') {
            return this.white_agent
        } else {
            return null
        }
    }

    const isAgent = (agent) => {
        return agent !== null
    }

    const step = () => {
        let turn = this.game.turn()
        const agent = getAgent(turn)

        if (this.game.game_over()) {
            updateStatus()
            return
        }

        if (isAgent(agent)) {
            const bestMove = agent.findMove(this.game)

            console.log("Agent move: ")
            console.log(JSON.stringify(bestMove))

            //const bestMove = response.move
            //const evaluation = response.evaluation


            const move = this.game.move(bestMove)
            this.board.position(this.game.fen())

            updateStatus()
            //updateEvaluation(this.game.turn(), evaluation)

            if (move == null) {
                // This should never happen if agents use game.moves()
                console.log('Illegal computer move: \'' + bestMove + '\'')
            }

            const slider = document.getElementById('myRange')
            const waitTime = slider.value * 10

            nextStep(waitTime)
        } else {
            this.board.position(this.game.fen())
            console.log('Waiting for human...')
        }
    }

    const dragStartEvent = (source, piece, position, orientation) => {
        // do not pick up pieces if the game is over
        if (this.game.game_over()) return false

        // Prevent control over computer agent
        if (getAgent(this.game.turn()) !== null) {
            return false
        }

        // only pick up pieces for the side to move
        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false
        }
    }

    const dropEvent = (source, target) => {
        // see if the move is legal
        const move = this.game.move({
            from:      source,
            to:        target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        })

        if (move == null) {
            return 'snapback'
        }

        nextStep()
    }

    const snapEndEvent = () => {
        // Update the chessboard position after the piece snap
        // For castling, en passant, pawn promotion
        this.board.position(this.game.fen())
    }

    console.log('initializing chess board')
    this.board = Chessboard('board1', {
        position:    'start',
        draggable:   true,
        moveSpeed:   5,
        onDragStart: dragStartEvent,
        onDrop:      dropEvent,
        onSnapEnd:   snapEndEvent,
    })

    return {
        nextStep: async function (timeout) {
            console.log('nextStep() called')
            return nextStep(timeout)
        },
    }



})
