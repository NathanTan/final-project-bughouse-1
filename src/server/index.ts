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

interface Player {
    sockId: string,
    name: string,
    hand: string[]
}

interface Hands{
    board1WhiteHand: string[],
    board1BlackHand: string[],
    board2WhiteHand: string[],
    board2BlackHand: string[]
}

interface Players {
    board1White?: Player,
    board1Black?: Player,
    board2White?: Player,
    board2Black?: Player
}

interface Session {
    name: string;
    players: Players;
    namespace: SocketIO.Namespace;
    game1: Chess;
    game2: Chess;
    hands: Hands;
}

const sessions: { [name: string]: Session } = {};

app.get('/session/:name', function(req, res) {
    const name: string = req.params.name;
    if (!sessions[name]) {
        const gameSession: Session = {
            name,
            players: {},
            namespace: io.of(name),
            game1: new Chess(),
            game2: new Chess(),
            hands: {
                board1BlackHand: [],
                board1WhiteHand: [],
                board2BlackHand: [],
                board2WhiteHand: []
            }
        };
        sessions[name] = gameSession;
        gameSession.namespace.on('connection', function(sock) {
            const sockId = sock.id;
            const fen1 = gameSession.game1.fen();
            const fen2 = gameSession.game2.fen();
            const players = gameSession.players;
            let hand="";


            let playerKey: keyof Players;
            console.log("New connection:", sockId);
            console.log("Game 1: " + fen1);
            console.log("Game 2: " + fen2);
            sock.emit('initGame', {fen1, fen2}, players);
            sock.on('move', function(moveData: MoveData) {
                console.log("I received a move", moveData.move.san, "from board", moveData.board);

                let fen: string;
                if (moveData.board === "1") { // board1
                    gameSession.game1.move(moveData.move);
                    fen = gameSession.game1.fen();

                    if(moveData.move.captured){ //If there was a piece captured
                        if(moveData.move.color === "w"){                           
                            gameSession.hands.board2BlackHand.push(moveData.move.captured) // add the piece to the player's partner's hand
                        }
                        else if(moveData.move.color === "b"){                            
                            gameSession.hands.board2WhiteHand.push(moveData.move.captured);// add the piece to the player's partner's hand
                        }
                    }

                } else if (moveData.board === "2") { // board2
                    gameSession.game2.move(moveData.move);
                    fen = gameSession.game2.fen();

                    if(moveData.move.captured){ //If there was a piece captured
                        if(moveData.move.color === "w"){                           
                            gameSession.hands.board1BlackHand.push(moveData.move.captured)// add the piece to the player's partner's hand
                        }
                        else if(moveData.move.color === "b"){                           
                            gameSession.hands.board1WhiteHand.push(moveData.move.captured)// add the piece to the player's partner's hand
                        }
                    }

                } else return;


                console.log("Sending fen:", fen);
                sock.broadcast.emit('gameChanged', moveData.board, fen, gameSession.hands);
            });
            sock.on('playerNameChanged', function(playerId: keyof Players, name: string, fn: Function) {
                playerKey = playerId;
                const player = gameSession.players[playerId];

                // Allow name change if player is null
                if (!player) {
                    gameSession.players[playerId] = {
                        sockId: sockId,
                        name: name,
                        hand: new Array()
                    }
                }
                // Allow player to change their own name
                else if (player.sockId === sockId) {
                    player.name = name;
                } else return;

                console.log(playerId, 'player name changed to', name);
                fn(playerKey);
                sock.broadcast.emit('playerNameChanged', playerId, name);
            });
            sock.on('disconnect', function() {
                console.log("Disconnect:", sockId);
                if (playerKey) {
                    gameSession.players[playerKey] = undefined;
                    sock.broadcast.emit('playerNameChanged', playerKey, "");
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

app.get('*', function(req, res) {
    res.render('404page');
});


const port = process.env.PORT || 3000;
server.listen(port);
