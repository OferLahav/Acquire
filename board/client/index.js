var gameID;
var boardData;
var neighbors = [];
var thisTile = null;
var updateTiles = [];
var socket;
var board;
var companies;
var purchaseOrder = null;

var stockValues = {
    s: [0,0,200,300,400,500,600,700,800,800,800,800,800,800,800,800,800,800,800,800,800,800,900],
    m: [0,0,300,400,500,600,600,700,800,800,800,800,800,800,800,800,800,900,900,900,900,900,900],
    l: [0,0,400,500,600,700,600,700,800,900,900,900,900,900,900,900,900,900,900,900,900,900,900]
}

function createTableDynamically () {
    var newBoard = $('#gameboard');
    newBoard.add('table');
    var table = document.createElement('table');
    for (var i = 0; i < 10; i++) {
        var row = document.createElement('tr');
        for (var j = 0 ; j < 10; j++) {
            var td = document.createElement('td');
            td.innerHTML = '<button class="tiles" id="' + i + '_' + j +'"></button>';
            row.appendChild(td);
        }
        table.appendChild(row);
    }
    newBoard.append(table);

    newBoard.show();
}

function highlightUsertiles(user) {
    user.tiles.forEach(function (t) {
        $('#' + t.x + '_' + t.y).css('border', 'solid green 1px');
    });
}

function getNeighbors(tile){
    var neighbors = [];

    var northNeighbor = board[(tile.x - 1) + "_" + tile.y];
    if (northNeighbor) neighbors.push(northNeighbor);
    
    var southNeigbor = board[(tile.x + 1) + "_" + tile.y];
    if (southNeigbor) neighbors.push(southNeigbor);
    
    var eastNeighbor = board[tile.x + "_" + (tile.y + 1)];
    if (eastNeighbor) neighbors.push(eastNeighbor);
    
    var westNeighbor = board[tile.x + "_" + (tile.y - 1)];
    if (westNeighbor) neighbors.push(westNeighbor);

    return neighbors;
}

function addTileToCorporation(tile, comp){
    tile.company = comp;
    companies[comp].size++;
    updateTiles.push(tile);

    var neighbors = getNeighbors(tile);
    
    neighbors.forEach(function(n){
        if (n.filled && n.company !== comp){
            addTileToCorporation(n, comp);
        }
    });
}

function createCompany() {
    var colorNsize = this.id.split('_');
    addTileToCorporation(thisTile, colorNsize[0]);
    console.log('COLORNSIZE: '+ this.id);

    $('#gameboard').show()
    $('#corpSelectList').hide()

    // User gets initialize incorporation stock
    companies[colorNsize[0]].remaining--;
    user.stocks[colorNsize[0]] = 1;

    $('#' + colorNsize[0] + '_stock').text(
        parseInt($('#' + colorNsize[0] + '_stock').text()) + 1 );
    
    console.log('createCompany : ' + updateTiles.length);
    socket.emit('selectTile', { tiles: updateTiles, board: board, companies: companies});

    updateTiles = [];
    updateTiles.foo = function(){};
    updateTiles= {
        0:'test'
    }
    thisTile = null;
}

//function setBoard(socket, data) {
function setBoard(socket) {

    var tileClick = function (event) {
        var tileId = event.currentTarget.id;
        var tile = user.tiles.find(c => c.id === tileId);
        
        if(!tile) return console.log('Error finding id');
        console.log('Curr tile: ' +tile.id);
        // fill picked tile
        var pickedTileOnBoard = board[tile.id];
        if (!pickedTileOnBoard) return console.log('An error occured on board.');

        pickedTileOnBoard.filled = true;
        thisTile = tile;

        // Get neighboring tiles and check their status
        var incorporatedNeighborTiles = [];
        var builtNeighborTiles = [];
        var countEmptyNeighbors = 0;

        var neighbors = getNeighbors(pickedTileOnBoard);

        neighbors.forEach(function (n) {
            if (n.company && !incorporatedNeighborTiles.find(c=>c.company === n.company)) {
                incorporatedNeighborTiles.push(n);
            } else if (n.filled){
                builtNeighborTiles.push(n);
            } else {
                countEmptyNeighbors++;
            }
        });
        
        // Check neighbors' statuses and react accordingly
        var clearVars = true;

        if (countEmptyNeighbors === neighbors.length){
            // No built neighbors >> Do nothing
            updateTiles.push(pickedTileOnBoard);
            console.log('DO NOTHING');
        } else if (incorporatedNeighborTiles.length === 1){
            // Only one incorporated neighbor >> Add tile to corporation
            console.log('ADD TILE TO CORP ' + incorporatedNeighborTiles[0].company);
            addTileToCorporation(pickedTileOnBoard, incorporatedNeighborTiles[0].company);
            
        } else if (incorporatedNeighborTiles.length > 1){
            // Two or more corporations are to be merged

            // Find biggest corporation of the merged corps
            var indexBiggestCorp = 0;
            var sizeCheck = 0;
            var biggestCorpName = '';

            for (var i = 0; i < incorporatedNeighborTiles.length; i++) {
                var corpName = incorporatedNeighborTiles[i].company;
                var currCorpSize = companies[corpName].size;
                if (currCorpSize > sizeCheck){
                    indexBiggestCorp = i;
                    biggestCorpName = corpName;
                    sizeCheck = currCorpSize;
                }
            };

            incorporatedNeighborTiles.splice(indexBiggestCorp,1);

            incorporatedNeighborTiles.forEach(function(n){
                // recursively add smaller corps tiles to biggest corporation
                addTileToCorporation(n, biggestCorpName);
                
                // defunct smaller corps and handle shareholder bonuses

                // handlestocks

            });
        } else if (builtNeighborTiles.length > 0){
            console.log('INCORPORATE TILES');
            // No incorporated neighbors, only built >> Incorporate new company
            $('#gameboard').hide()
            $('#corpSelectList').show()

            clearVars = false;
        }

        if (clearVars){
            console.log('clearVars : ' + updateTiles.length);
            socket.emit('selectTile', { tiles: updateTiles, board: board, companies: companies});
            updateTiles = [];
            thisTile = null;

            clearVars = true;
        }
        
        // This is stupid.
        $('#stockPurchase').show();

        // Remove picked tile from user optional tiles
        $('#' + tileId).css('border', 'solid white 1px');

        for( var i = 0; i < 6 ; i++){
            if(user.tiles[i].id === tileId ) {
                user.tiles.splice(i, 1);
                break;
            }
        }

        // Get new tile from unpicked tiles pile
        user.tiles.indexOf({})
        $.get('/newTile', {gameID: gameID}).then(function (tile) {
            user.tiles.push(tile);
            highlightUsertiles(user);
        })
    }

    createTableDynamically();

    highlightUsertiles(user);

    $('.tiles').on('click', tileClick);
}

$(function () {
    socket = io();

    $('#loginformID').submit(function () {
        var value = $('#m').val();
        if (parseInt(value)) {
            $.get('/newGame', { numOfPlayers: value }).then(function (data) {
                $('#loginform').hide();
                board = data.board;
                user = data.user;
                gameID = data.id;
                companies = data.companies;
                $('#money').text(user.money);
                setBoard(socket, data);
            })
        } else if (value === 'login') {
            $.get('/login', { gameID: 0 }).then(function (data) {
                if (!data) {
                    alert("Too many active players in this game!")
                }
                $('#loginform').hide();
                board = data.board;
                user = data.user;
                companies = data.companies;
                $('#money').text(user.money);
                setBoard(socket, data);
            });
            

        } else {
            socket.emit('chat message', value);
        }
        $('#m').val('');
        return false;
    });

    $('#stockPurchaseForm').on('click', function () {
        // TODO: only 3 allowed & cant buy sold out stocks & must have enough money

        user.money -= purchaseOrder.total;
        $('#money').text(user.money);

        for(var c in purchaseOrder) {
            if (c !== 'total') {
                // remove from available
                companies[c].remaining -= purchaseOrder[c].numOfStocks;
                // add to user's stocks
                if (!user.stocks[c]) {
                    user.stocks[c] = parseInt(purchaseOrder[c].numOfStocks);
                } else {
                    user.stocks[c] += parseInt(purchaseOrder[c].numOfStocks);
                }
                $('#' + c + '_stock').text(user.stocks[c]);
            }
        }

        
        
        purchaseOrder = null;
        $('#stockPurchase').hide();
    })

    $('.stockValueInput').on('change', function(e, v , a){

        var company = $(e.currentTarget).parent().parent()[0].cells[0].innerHTML;
        var numOfStocks = e.currentTarget.value;

        if (!purchaseOrder) {
            purchaseOrder = {}
        }

        purchaseOrder[company] = { numOfStocks: numOfStocks };

        purchaseOrder.total = 0;
        for(var c in purchaseOrder) {
            if (c !== 'total') {
                purchaseOrder.total += stockValues[companies[c].cap][companies[c].size] * purchaseOrder[c].numOfStocks
            }
        }

        if (purchaseOrder.total > user.money){
            $('#error_message').text('WRONG');
        }

        $('#totalPurchase').text(purchaseOrder.total)

    })

    socket.on('updateTile', function (data) {
        data.tiles.forEach(function(tile){
            $('#'+ tile.id).css('background', tile.company || 'white');
        });
        board = data.board;
        companies = data.companies;

        for(var c in companies) {
            $('#' + c + '_value').text('@' + stockValues[companies[c].cap][companies[c].size])
        }
    });

    $('.corpSelect').on('click', createCompany)

    $(document).on('ready', () => {
        $.get('/getActiveGames', (games) => {
            console.log(games)
            var activeGames = $('#messages');
            // activeGames.add('table');
            // var table = document.createElement('table');
            for (var i = 0; i < games.length; i++) {
                var game = document.createElement('li');
                // for (var j = 0 ; j < games.lengh; j++) {
                    // var td = document.createElement('td');
                game.innerHTML = '<button class="tasdf"> Game ' + games[i].id + '</button>';
                //     row.appendChild(td);
                // }
                $(activeGames).append(game);
            }
            // board.append(table);
        });
    })

});