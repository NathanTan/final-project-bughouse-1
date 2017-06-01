import * as express from 'express';
import * as http from 'http';
import * as handlebars from 'express-handlebars';
import * as path from 'path';
import * as socket from 'socket.io';

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

sock.on('connection', function(sock) {
	console.log("A user connected");
	repeating(sock);
});

function repeating(sock: SocketIO.Socket) {
	console.log("Sending message...");
	sock.emit('eh', { foo: "My data, received through a socket, from a server!!" });
	setTimeout(() => repeating(sock), 1000);
}

server.listen(3000);
