
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
	board1: ChessBoardInstance;
	board2: ChessBoardInstance;
	playerInputs: {
		board1White: HTMLInputElement,
		board1Black: HTMLInputElement,
		board2White: HTMLInputElement,
		board2Black: HTMLInputElement
	};
	game: {boardname: string, state: Chess};
	game2: {boardname: string, state: Chess};

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
			draggable: false,
			onDrop: this.onDrop,
			onDragStart: this.onDragStart,
			onSnapEnd: this.onSnapEnd,
			orientation: 'black'
		}
		const board1 = document.getElementById('board1');
		const board2 = document.getElementById('board2');
		this.board1 = ChessBoard(board1, board1Config);
		this.board2 = ChessBoard(board2, board2Config);
		this.game = {
            state: new Chess(),
            boardname: "1"
		};
		this.game2 = {
            state: new Chess(),
		    boardname: "2"
        };
		this.playerInputs = {} as any;
		const playerNameInputs = document.getElementsByName('player-name');
		for (var i = 0; i < playerNameInputs.length; i++) {
			let input = playerNameInputs[i];
			(this.playerInputs as any)[input.id] = input;
			input.addEventListener('change', this.playerNameChange);
		}
	}

	initGame = ( boards:{ fen: string , fen2: string}, players: Players) => {
		console.log("fen: " + boards.fen);
		console.log("fen2: " + boards.fen2);
		this.game.state.load(boards.fen);
		this.game2.state.load(boards.fen2);
		this.board1.position(boards.fen);
		this.board2.position(boards.fen2);

		if (players.board1White)
				this.playerInputs.board1White.value = players.board1White.name;
		if (players.board1Black)
				this.playerInputs.board1Black.value = players.board1Black.name;
		if (players.board2White)
				this.playerInputs.board2White.value = players.board2White.name;
		if (players.board2Black)
				this.playerInputs.board2Black.value = players.board2Black.name;
	};

	playerNameChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		const id = input.id;
		const newPlayerName = input.value;
		this.sock.emit('playerNameChanged', id, newPlayerName);
    };

	playerNameChanged = (id: string, name: string) => {
		console.log(name);
		const input: HTMLInputElement = document.getElementById(id) as HTMLInputElement;
		if (input) {
			input.value = name;
        }
    };

	gameChanged = (state:{board: string, fen: string}) => {
		console.log("Game changed on bard " + state.board)
		if(state.board === "1"){
			this.game.state.load(state.fen);
			this.board1.position(state.fen);
			this.board1.position(state.fen);
		}
		else if(state.board === "2"){
			this.game.state.load(state.fen);
			this.board2.position(state.fen);
		}
	}

	// do not pick up pieces if the game is over
	// only pick up pieces for the side to move
	onDragStart = (
		source: string,
		piece: string,
		position: string,
		orientation: string) => {
		if (this.game.state.game_over() ||
			(this.game.state.turn() === 'w' && piece.search(/^b/) !== -1) ||
			(this.game.state.turn() === 'b' && piece.search(/^w/) !== -1)) {
			return false;
		}
	}

	onDrop = (
		source: string,
		target: string,
		piece: string,
		newPos: object,
		oldPos: object,
		orientation: string) => {

		const move = this.game.state.move({
			from: source,
			to: target,
			promotion: 'q' // TODO: allow user to pick promotion piece
		});

		// illegal move
		if (!move) return 'snapback';

		console.log("I'm sending a move", move);
		this.sock.emit('move',
		{
			board: this.game.boardname,
			move: move
		});
	}

	// update the board position after the piece snap
	// for castling, en passant, pawn promotion
	onSnapEnd = () => {
		this.board1.position(this.game.state.fen());
	}
}

function initSession(name: string) {
	console.log("Creating new session: " + name);
	const elem = document.getElementById('root')!;
	const app = new App(elem, name);
}
