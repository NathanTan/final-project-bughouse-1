
interface State {
	count: number;
	data: string;
}

class App {
	sock: SocketIOClient.Socket;
	board1: ChessBoardInstance;
	board2: ChessBoardInstance;
	game: Chess;

	state = {
		count: 0,
		data: ''
	};

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
			orientation: 'black'
		}
		const board1 = document.getElementById('board1');
		const board2 = document.getElementById('board2');
		this.board1 = ChessBoard(board1, board1Config);
		this.board2 = ChessBoard(board2, board2Config);
		this.game = new Chess();

		const playerNameInputs = document.getElementsByName('player-name');
		for (var i = 0; i < playerNameInputs.length; i++) {
			playerNameInputs[i].addEventListener('change', this.playerNameChange);
		}
	}

	playerNameChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
		console.log(input.value);
		const id = input.id;
		const newPlayerName = input.value;
		this.sock.emit('playerNameChanged', id, newPlayerName);
	}

	playerNameChanged = (id: string, name: string) => {
		console.log(name);
		const input: HTMLInputElement = document.getElementById(id) as HTMLInputElement;
		if (input) {
			input.value = name;
		}
	}

	initGame = (fen: string) => {
		console.log(fen);
		this.game.load(fen);
		this.board1.position(fen);
		this.board2.position(fen);
	};

	gameChanged = (fen: string) => {
		this.game.load(fen);
		this.board1.position(fen);
		this.board2.position(fen);
	}

	// do not pick up pieces if the game is over
	// only pick up pieces for the side to move
	onDragStart = (
		source: string,
		piece: string,
		position: string,
		orientation: string) => {
		console.log("onDragStart");
		if (this.game.game_over() === true ||
			(this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
			(this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
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

		const move = this.game.move({
			from: source,
			to: target,
			promotion: 'q' // TODO: allow user to pick promotion piece
		});

		// illegal move
		if (!move) return 'snapback';

		console.log("I'm sending a move", move);
		this.sock.emit('move', move);
	}

	// update the board position after the piece snap 
	// for castling, en passant, pawn promotion
	onSnapEnd = () => {
		this.board1.position(this.game.fen());
	}
}

function initSession(name: string) {
	console.log("Creating new session: " + name);
	const elem = document.getElementById('root')!;
	const app = new App(elem, name);
}
