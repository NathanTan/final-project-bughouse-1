interface State {
    count: number;
    data: string;
}

interface Player {
    sockId: string,
    name: string
}

interface Hands {
    board1WhiteHand?: string[],
    board1BlackHand?: string[],
    board2WhiteHand?: string[],
    board2BlackHand?: string[]
}

interface Players {
    board1w?: Player,
    board1b?: Player,
    board2w?: Player,
    board2b?: Player
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
        board1w: HTMLInputElement,
        board1b: HTMLInputElement,
        board2w: HTMLInputElement,
        board2b: HTMLInputElement
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
        const board1El = document.getElementById('board1')!;
        const board2El = document.getElementById('board2')!;
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
            const input = playerNameInputs[i];
            (this.playerInputs as any)[input.dataset.position!] = input;
            input.addEventListener('change', this.onPlayerNameChange);
        }
    }

    initGame = (boards: {fen1: string , fen2: string}, players: Players) => {
        this.game1.state.load(boards.fen1);
        this.game2.state.load(boards.fen2);
        this.board1.position(boards.fen1);
        this.board2.position(boards.fen2);

        this.updateTurnIndicator(this.game1.boardName, this.game1.state.turn());
        this.updateTurnIndicator(this.game2.boardName, this.game2.state.turn());

        if (players.board1w)
                this.playerInputs.board1w.value = players.board1w.name;
        if (players.board1b)
                this.playerInputs.board1b.value = players.board1b.name;
        if (players.board2w)
                this.playerInputs.board2w.value = players.board2w.name;
        if (players.board2b)
                this.playerInputs.board2b.value = players.board2b.name;

        this.updateEndingModal();
    }

    onPlayerNameChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const id = input.dataset.position;
        const newPlayerName = input.value;
        this.sock.emit('playerNameChanged', id, newPlayerName, this.nameChangeConfirmed);
    }

    nameChangeConfirmed = (playerId: string) => {
        // Set player's board position
        switch (playerId) {
            case "board1w":
                this.me = {boardName: "1", color: "w"};
                break;
            case "board1b":
                this.me = {boardName: "1", color: "b"};
                break;
            case "board2w":
                this.me = {boardName: "2", color: "w"};
                break;
            case "board2b":
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

    gameChanged = (boardname: string, fen: string, hands: Hands) => {
        console.log("Game changed on board", boardname);
        if (boardname === "1") {
            this.game1.state.load(fen);
            this.board1.position(fen);
            this.updateTurnIndicator(boardname, this.game1.state.turn());
            if (this.game1.state.in_checkmate()) {
                const playerName = `#board1${this.game1.state.turn()}`;

            }
        } else if (boardname === "2") {
            this.game2.state.load(fen);
            this.board2.position(fen);
            this.updateTurnIndicator(boardname, this.game2.state.turn());
        }
        this.updateEndingModal();
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

        const boardName = this.me.boardName;
        const gameEngine = (boardName === "1") ? this.game1.state : this.game2.state;
        const move = gameEngine.move({
            from: source,
            to: target,
            promotion: 'q' // TODO: allow user to pick promotion piece
        });

        this.updateTurnIndicator(boardName, gameEngine.turn());
        this.updateEndingModal();

        // illegal move
        if (!move) return 'snapback';

        console.log("I'm sending a move", move);
        this.sock.emit('move', {
            board: this.me.boardName,
            move: move
        });
    }

    updateTurnIndicator(boardName: string, turn: string) {
        if (turn === "w") {
            // You asked for this
            $(`#board${boardName}w .player-turn`).addClass("active");
            $(`#board${boardName}b .player-turn`).removeClass("active");
        } else {
            $(`#board${boardName}b .player-turn`).addClass("active");
            $(`#board${boardName}w .player-turn`).removeClass("active");
        }
    }

    updateEndingModal() {
        if (this.game1.state.in_checkmate()) {
            const $modal = $("#board1").siblings(".modal");
            $modal.addClass("active");
            const color = this.game2.state.turn() === "w" ? "b" : "w";
            const playerKey = "board1" + color as keyof Players;
            const playerName = this.playerInputs[playerKey].value || color;
            $modal.children("h3").text(`${playerName} won!`);
        } else if (this.game2.state.in_checkmate()) {
            const $modal = $("#board2").siblings(".modal");
            $modal.addClass("active");
            const color = this.game2.state.turn() === "w" ? "b" : "w";
            const playerKey = "board2" + color as keyof Players;
            const playerName = this.playerInputs[playerKey].value || color;
            $modal.children("h3").text(`${playerName} won!`);
        }
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

declare interface Window {
    app?: App;
}

function initSession(name: string) {
    console.log("Creating new session: " + name);
    const elem = document.getElementById('root')!;
    window.app = new App(elem, name);
}
