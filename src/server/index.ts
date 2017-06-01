/// <reference path="../chess.d.ts" />

import * as express from 'express';
import * as http from 'http';
import * as handlebars from 'express-handlebars';
import * as path from 'path';
import * as socket from 'socket.io';
import * as chess from 'chess.js';

const app = express();
const server = (http as any).Server(app);
const sock = socket.listen(server);

app.engine('handlebars', handlebars({
	defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');

app.use('/', express.static('./public'));
app.use('/lib', express.static('./node_modules'));
app.use('/src', express.static('./src'));

app.get('/', function(req, res) {
	res.render('home');
});

const clients: SocketIO.Socket[] = [];
sock.on('connection', function(sock) {
	clients.push(sock);
	sock.on('move', function(move: Move) {
		for (const client of clients) {
			if (sock !== client) {
				client.emit('gameChanged', move);
			}
		}
	});
});



function repeating(sock: SocketIO.Socket) {
	console.log("Sending message...");
	sock.emit('eh', { foo: "My data, received through a socket, from a server!!" });
	setTimeout(() => repeating(sock), 1000);
}

server.listen(3000);
