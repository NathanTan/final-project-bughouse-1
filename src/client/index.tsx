
interface State {
	count: number;
	data: string;
}



class App {
	sock: SocketIOClient.Socket;
	board1: ChessBoardInstance;
	board2: ChessBoardInstance;
	game: {boardname: string, state: Chess};
	game2: {boardname: string, state: Chess};

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
			onDrop: this.onDrop.bind(this),
			onDragStart: this.onDragStart.bind(this),
			onSnapEnd: this.onSnapEnd.bind(this)
		}
		const board2Config: ChessBoardJS.BoardConfig = {
			showNotation: false,
			draggable: false,
			onDrop: this.onDrop.bind(this),
			onDragStart: this.onDragStart.bind(this),
			onSnapEnd: this.onSnapEnd.bind(this),
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
	}

	initGame = ( boards:{ fen: string , fen2: string}) => {
		console.log("fen: " + boards.fen);
		console.log("fen2: " + boards.fen2);
		this.game.state.load(boards.fen);
		this.game2.state.load(boards.fen2);
		this.board1.position(boards.fen);
		this.board2.position(boards.fen2);
	};

	gameChanged = (state:{board: string, fen: string}) => {
		console.log("Game changed on bard " + state.board)
		if(state.board === "1"){
			this.game.state.load(state.fen);
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
		console.log("onDragStart");
		console.log(source + " or no source?")
		console.log(this)
		
		if (this.game.state.game_over() === true ||
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
