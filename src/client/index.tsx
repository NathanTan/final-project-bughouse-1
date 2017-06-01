
interface State {
	count: number;
	data: string;
}

class App {
	sock: SocketIOClient.Socket;
	board: ChessBoardInstance;
	game: Chess;

	state = {
		count: 0,
		data: ''
	};

	constructor(private rootElem: HTMLElement, name: string) {
		this.sock = io(name);
		this.sock.on('gameChanged', this.gameChanged);
		this.sock.on('initGame', this.initGame);

		const config: ChessBoardJS.BoardConfig = {
			draggable: true,
			onDrop: this.onDrop.bind(this)
		}
		this.board = ChessBoard(rootElem, config);
		this.game = new Chess();
	}

	initGame = (fen: string) => {
		console.log(fen);
		this.game.load(fen);
		this.board.position(fen);
	};

	gameChanged = (move: ChessJS.Move) => {
		this.game.move(move);
		this.board.move(move.from + "-" + move.to);
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
	const elem = document.getElementById('root')!;
	const app = new App(elem, name);
}
