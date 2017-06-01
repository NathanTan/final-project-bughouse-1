
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

	constructor(private rootElem: HTMLElement) {
		this.sock = io();
		this.sock.on('gameChanged', this.gameChanged);


		const config: ChessBoardJS.BoardConfig = {
			draggable: true,
			onDrop: this.onDrop.bind(this),
			position: 'start'
		}
		this.board = ChessBoard(rootElem, config);
		this.game = new Chess();
	}

	gameChanged = (move: Move) => {
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

		this.sock.emit('move', move);
	}
}

const elem = document.getElementById('root')!;
const app = new App(elem);
