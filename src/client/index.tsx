
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
	game: Chess;

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

		this.playerInputs = {} as any;
		const playerNameInputs = document.getElementsByName('player-name');
		for (var i = 0; i < playerNameInputs.length; i++) {
			let input = playerNameInputs[i];
			(this.playerInputs as any)[input.id] = input;

			input.addEventListener('change', this.playerNameChange);
		}
	}

	playerNameChange = (e: Event) => {
		const input = e.target as HTMLInputElement;
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

	initGame = (fen: string, players: Players) => {
		console.log(fen);
		this.game.load(fen);
		this.board1.position(fen);
		this.board2.position(fen);
		if (players.board1White)
			this.playerInputs.board1White.value = players.board1White.name;
		if (players.board1Black)
			this.playerInputs.board1Black.value = players.board1Black.name;
		if (players.board2White)
			this.playerInputs.board2White.value = players.board2White.name;
		if (players.board2Black)
			this.playerInputs.board2Black.value = players.board2Black.name;
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
