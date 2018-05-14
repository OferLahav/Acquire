var express = require('express');
var gameController = require('./server/gameController');

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', (req, res) =>
    res.sendFile(__dirname + '/client/index.html')
);

var numOfUsers = 0;
var activePlayers = 0;

app.get('/newGame', (req, res) => {
    res.send(gameController.createNewGame(req.query.numOfPlayers))
});

app.get('/login', (req, res) => {
    res.send(gameController.logIntoGameByID(req.query.gameID))
});

app.get('/getActiveGames', (req, res) => {
    res.send(gameController.getActiveGames())
});

app.get('/newTile', (req, res) => {
    res.send(pickTiles(1)[0])
});

app.use('/static', express.static('client'))

io.on('connection', (socket) => {
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
    });
    socket.on('login', function(id) {
        console.log(io.sockets)
    });
    socket.on('selectTile', function(tile) {
        io.sockets.emit('updateTile', tile);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});