/// <reference path="../chess.d.ts" />

import * as express from 'express';
import * as http from 'http';
import * as handlebars from 'express-handlebars';
import * as path from 'path';
import * as socket from 'socket.io';
import * as bodyParser from 'body-parser';
import { Chess } from 'chess.js';

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
	game: Chess;
}

const sessions: { [name: string]: Session } = {};

app.get('/session/:name', function(req, res) {
	const name: string = req.params.name;
	if (!sessions[name]) {
		const newSession = {
			name,
			namespace: io.of(name),
			game: new Chess()
		};
		sessions[name] = newSession;
		newSession.namespace.on('connection', function(sock) {
			const fen = newSession.game.fen();
			console.log(fen);
			sock.emit('initGame', fen);
			sock.on('move', function(move: ChessJS.Move) {
				console.log("I received a move", move);
				newSession.game.move(move);
				sock.broadcast.emit('gameChanged', move);
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
