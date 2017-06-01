
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
		this.sock.on('eh', this.onEh);


		const config: ChessBoardJS.BoardConfig = {
			draggable: true,
			onDrop: this.onDrop.bind(this),
			position: 'start'
		}
		this.board = ChessBoard(rootElem, config);
		this.game = new Chess();
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
	}

	onEh = (data: any) => {
		const newState = {...this.state};
		newState.count++;
		newState.data = data.foo;
		this.state = newState;
	};

	render() {
		ReactDOM.render(
			<div>
				<p>I have eh'd {this.state.count} times.</p>
				<p>Here is my data: {this.state.data}</p>
			</div>, this.rootElem);
	}
}

const elem = document.getElementById('root')!;
const app = new App(elem);
