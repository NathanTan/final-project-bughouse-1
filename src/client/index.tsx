
interface State {
    count: number;
    data: string;
}

interface Player {
    sockId: string,
    name: string
}

interface Players {
    board1White?: Player,
    board1Black?: Player,
    board2White?: Player,
    board2Black?: Player
}


class App {
    sock: SocketIOClient.Socket;
    me: {
        boardName: string,
        color: string
    }
    board1: ChessBoardInstance;
    board2: ChessBoardInstance;
    playerInputs: {
        board1White: HTMLInputElement,
        board1Black: HTMLInputElement,
        board2White: HTMLInputElement,
        board2Black: HTMLInputElement
    };
    game1: {boardName: string, state: Chess};
    game2: {boardName: string, state: Chess};

    constructor(private rootElem: HTMLElement, name: string) {
        this.sock = io(name);
        this.sock.on('gameChanged', this.gameChanged);
        this.sock.on('initGame', this.initGame);
        this.sock.on('playerNameChanged', this.playerNameChanged);

        const board1Config: ChessBoardJS.BoardConfig = {
            showNotation: false,
            draggable: true,
            onDrop: this.onDrop.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this)
        }
        const board2Config: ChessBoardJS.BoardConfig = {
            showNotation: false,
            draggable: true,
            onDrop: this.onDrop,
            onDragStart: this.onDragStart,
            onSnapEnd: this.onSnapEnd,
            orientation: 'black'
        }
        const board1El = document.getElementById('board1');
        const board2El = document.getElementById('board2');
        this.board1 = ChessBoard(board1El, board1Config);
        this.board2 = ChessBoard(board2El, board2Config);
        this.game1 = {
            state: new Chess(),
            boardName: "1"
        };
        this.game2 = {
            state: new Chess(),
            boardName: "2"
        };
        this.playerInputs = {} as any;
        const playerNameInputs = document.getElementsByName('player-name');
        for (var i = 0; i < playerNameInputs.length; i++) {
            let input = playerNameInputs[i];
            (this.playerInputs as any)[input.id] = input;
            input.addEventListener('change', this.onPlayerNameChange);
        }
    }

    initGame = (boards: {fen1: string , fen2: string}, players: Players) => {
        console.log("fen1: " + boards.fen1);
        console.log("fen2: " + boards.fen2);
        this.game1.state.load(boards.fen1);
        this.game2.state.load(boards.fen2);
        this.board1.position(boards.fen1);
        this.board2.position(boards.fen2);

        if (players.board1White)
                this.playerInputs.board1White.value = players.board1White.name;
        if (players.board1Black)
                this.playerInputs.board1Black.value = players.board1Black.name;
        if (players.board2White)
                this.playerInputs.board2White.value = players.board2White.name;
        if (players.board2Black)
                this.playerInputs.board2Black.value = players.board2Black.name;
    }

    onPlayerNameChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const id = input.id;
        const newPlayerName = input.value;
        this.sock.emit('playerNameChanged', id, newPlayerName, this.nameChangeConfirmed);
    }

    nameChangeConfirmed = (playerId: string) => {
        // Set player's board position
        switch (playerId) {
            case "board1White":
                this.me = {boardName: "1", color: "w"};
                break;
            case "board1Black":
                this.me = {boardName: "1", color: "b"};
                break;
            case "board2White":
                this.me = {boardName: "2", color: "w"};
                break;
            case "board2Black":
                this.me = {boardName: "2", color: "b"};
                break;
        }

        for (let key in this.playerInputs) {
            let input = this.playerInputs[key as keyof Players];
            input.disabled = (key !== playerId);
        }
    }

    playerNameChanged = (playerId: keyof Players, name: string) => {
        console.log(name);
        const input = this.playerInputs[playerId];
        if (input) {
            input.value = name;
        }
    }

    gameChanged = (boardname: string, fen: string) => {
        console.log("Game changed on board", boardname);
        if (boardname === "1") {
            this.game1.state.load(fen);
            this.board1.position(fen);
        } else if (boardname === "2") {
            this.game2.state.load(fen);
            this.board2.position(fen);
        }
    }

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    onDragStart = (
        source: string,
        piece: string,
        position: string,
        orientation: string) => {

        // prevent drag if player has not joined the game
        if (!this.me) return false;
        // prevent drag if either game is over
        if (this.game1.state.game_over() || this.game2.state.game_over()) return false;
        // prevent drag if it's on the wrong board
        if (this.me.boardName === "1" && orientation === "black") return false;
        if (this.me.boardName === "2" && orientation === "white") return false;
        // prevent move if it's the wrong color
        if (this.me.color === "w" && piece.search(/^b/) !== -1) return false;
        if (this.me.color === "b" && piece.search(/^w/) !== -1) return false;
        // prevent move if it's not your turn
        if (this.me.boardName === "1" && this.game1.state.turn() !== this.me.color) return false;
        if (this.me.boardName === "2" && this.game2.state.turn() !== this.me.color) return false;
    }

    onDrop = (
        source: string,
        target: string,
        piece: string,
        newPos: object,
        oldPos: object,
        orientation: string) => {

        const gameEngine = (this.me.boardName === "1") ? this.game1.state : this.game2.state;
        const move = gameEngine.move({
            from: source,
            to: target,
            promotion: 'q' // TODO: allow user to pick promotion piece
        });

        // illegal move
        if (!move) return 'snapback';

        console.log("I'm sending a move", move);
        this.sock.emit('move', {
            board: this.me.boardName,
            move: move
        });
    }

    // update the board position after the piece snap
    // for castling, en passant, pawn promotion
    onSnapEnd = () => {
        if (this.me.boardName === "1")
            this.board1.position(this.game1.state.fen());
        else
            this.board2.position(this.game2.state.fen());
    }
}

function initSession(name: string) {
    console.log("Creating new session: " + name);
    const elem = document.getElementById('root')!;
    const app = new App(elem, name);
}
