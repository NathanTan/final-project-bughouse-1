/// <reference path="../chess.d.ts" />

import * as express from 'express';
import * as http from 'http';
import * as handlebars from 'express-handlebars';
import * as path from 'path';
import * as socket from 'socket.io';
import * as bodyParser from 'body-parser';
import { Chess } from 'chess.js';
import { MoveData } from '../models'

const app = express();
const server = (http as any).Server(app);
const io = socket.listen(server);

app.engine('handlebars', handlebars({
	defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', express.static('./public'));
app.use('/lib', express.static('./node_modules'));
app.use('/src', express.static('./src'));
app.use('/session/img', express.static('./public/img'));

app.get('/', function(req, res) {
	res.render('home', { sessions });
});

interface Session {
	name: string;
	namespace: SocketIO.Namespace;
	game1: Chess;
	game2: Chess;
}

const sessions: { [name: string]: Session } = {};

app.get('/session/:name', function(req, res) {
	const name: string = req.params.name;
	if (!sessions[name]) {
		const newSession = {
			name,
			namespace: io.of(name),
			game1: new Chess(),
			game2: new Chess()
		};
		sessions[name] = newSession;
		newSession.namespace.on('connection', function(sock) {
			const fen = newSession.game1.fen();
			const fen2 = newSession.game2.fen();
			console.log("Game 1: " + fen);
			console.log("Game 2: " + fen2);
			sock.emit('initGame', {fen, fen2});
			// sock.emit('initGame', fen2);
			sock.on('move', function(moveData: MoveData) {
				console.log("I received a move", moveData.move
				            + " from board " + moveData.board);
				if(moveData.board === "1"){ //For game 1
					newSession.game1.move(moveData.move);
					const fen: string = newSession.game1.fen();
					console.log("Sending fen", fen);
					sock.broadcast.emit('gameChanged', {board: moveData.board, move: fen});
				}
				else if(moveData.board === "2"){ //For game 2
					newSession.game2.move(moveData.move);
					const fen: string = newSession.game2.fen();
					console.log("Sending fen", fen);
				   sock.broadcast.emit('gameChanged', {board: moveData.board, move: fen2});
				}	
		});

		});
	}

	res.render('session', { name });
});

app.post('/session', function(req, res) {
	const newSessionName: string = req.body.newSessionName;
	if (newSessionName)	res.redirect('/session/' + newSessionName);
});

const port = process.env.PORT || 3000;
server.listen(port);
