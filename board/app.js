var board = [];
var tiles = [];
var users = [];
var NUM_OF_USERS = 4;

var express = require('express');

var companies = {
    blue: { remaining: 20, cap: 'l', size: 0 },
    orange: { remaining: 20, cap: 'l', size: 0 },
    green: { remaining: 20, cap: 'm', size: 0 },
    yellow: { remaining: 20, cap: 'm', size: 0 },
    pink: { remaining: 20, cap: 'm', size: 0 },
    purple: { remaining: 20, cap: 's', size: 0 },
    red: { remaining: 20, cap: 's', size: 0 },
}

// init empty board
for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
        board.push({
            x: i,
            y: j,
            filled: false,
            company: null
        })
        tiles.push({             
            x: i,
            y: j,
            filled: false,
            company: null 
        });
    }
}

// users
for (var i = 0; i < NUM_OF_USERS; i++) {
    users[i] = {
        money: 5000,
        stocks: {},
        tiles: pickTiles(6)
    }
}

function pickTiles(numOfTiles) {
    var selectedTiles = [];
    for (var i = 0; i < numOfTiles; i++) {
        var index = Math.floor(Math.random() * tiles.length);
        selectedTiles.push(tiles[index]);
        tiles.splice(index, 1);
    }
    return selectedTiles;
}

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', (req, res) =>
    res.sendFile(__dirname + '/client/index.html')
);

var numOfUsers = 0;
app.get('/login', (req, res) => {
    numOfUsers++;
    res.send({ user: users[numOfUsers], board: board, companies: companies })
});

app.get('/newTile', (req, res) => {
    res.send(pickTiles(1)[0])
    // io.sockets.emit('updateBoard', board);
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