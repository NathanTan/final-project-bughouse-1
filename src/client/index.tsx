
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

		const board1Config: ChessBoardJS.BoardConfig = {
			showNotation: false,
			draggable: true,
			onDrop: this.onDrop.bind(this)
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
	}

	initGame = (fen: string) => {
		console.log(fen);
		this.game.load(fen);
		this.board1.position(fen);
		this.board2.position(fen);
	};

	gameChanged = (move: ChessJS.Move) => {
		this.game.move(move);
		this.board1.move(move.from + "-" + move.to);
		this.board2.move(move.from + "-" + move.to);
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
			promotion: 'q'
		});

		if (!move) {
			return 'snapback';
		}

		console.log("I'm sending a move", move);
		this.sock.emit('move', move);
	}
}

function initSession(name: string) {
	console.log("Creating new session: " + name);
	const elem = document.getElementById('root')!;
	const app = new App(elem, name);
}
