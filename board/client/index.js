var boardData;
var neighbors = [];
var thisTile = null;
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
    var board = $('#gameboard');
    board.add('table');
    var table = document.createElement('table');
    for (var i = 0; i < 10; i++) {
        var row = document.createElement('tr');
        for (var j = 0 ; j < 10; j++) {
            var td = document.createElement('td');
            td.innerHTML = '<button class="tiles" id="' + i + '' + j +'"></button>';
            row.appendChild(td);
        }
        table.appendChild(row);
    }
    board.append(table);

    board.show();
}

function highlightUsertiles(user) {
    user.tiles.forEach(function (t) {
        $('#' + t.x + '' + t.y).css('border', 'solid green 1px');
    });
}

function createCompany() {
    var colorNsize = this.id.split('_');

    thisTile.company = colorNsize[0];
    thisTile.size = colorNsize[1];

    neighbors.forEach(function (n) {
        n.company = colorNsize[0];
        n.size = colorNsize[1];
    })

    $('#gameboard').show()
    $('#corpSelectList').hide()

    
    companies[colorNsize[0]].size = neighbors.length + 1;
    companies[colorNsize[0]].remaining--;
    user.stocks[colorNsize[0]] = 1;
    $('#' + colorNsize[0] + '_stock').text(
        parseInt($('#' + colorNsize[0] + '_stock').text()) + 1 );
    
    neighbors.push(thisTile);
    socket.emit('selectTile', { tiles: neighbors, board: board, companies: companies});

    neighbors = [];
    thisTile = null;
}

function setBoard(socket, data) {

    var tileClick = function (event) {
 
        var targetId = event.currentTarget.id;
        var found = false;
        user.tiles.forEach(function (t){
            var id = t.x + '' + t.y; 
            if( id == targetId) {
                found = true;
            }
        });

        if(!found) {
            return;    
        }
        
        // check for neighboring blocks
        board.forEach((t) => {
            var id = t.x + '' + t.y;            
            if (id == targetId) {
                t.filled = true;
                thisTile = t;
            }
            if ( t.filled &&
                ((t.x - 1) + '' + t.y == targetId ||
                 (t.x + 1) + '' + t.y == targetId ||
                 t.x + '' + (t.y - 1) == targetId ||
                 t.x + '' + (t.y + 1) == targetId )
            ) {
                neighbors.push(t);
            }
        })
        // merge multiple corporations
        if ( neighbors.length > 1) {
            // check for multiple corporations
            let merge = false;
            let comp = null;
            for (var i = 1; i < neighbors.length; i++) {
                if ( (neighbors[i].company !== neighbors[i-1].company) && neighbors[i].company !== null && neighbors[i-1].company !== null) {
                    merge = true;
                }
                if (neighbors[i].company !== null ) {
                    comp = neighbors[i].company;
                }
                if (neighbors[i-1].company !== null ) {
                    comp = neighbors[i-1].company;
                }

            }
            if (merge) {
                // identify the merger and and the mergee
                var largestComp;
                var largestSize = -1;
                neighbors.forEach(function (n) {
                    if (n.company) {
                        if (companies[n.company].size > largestSize) {
                            largestSize = companies[n.company].size ;
                            largestComp = n.company;
                        }
                    }
                });

                var otherCompanies = [];
                neighbors.forEach(function (n) {
                    if (n.company !== largestComp) {
                        otherCompanies.push(n.company);
                    }
                });

                otherCompanies.forEach(function (c) {
                    companies[c].size = 0;
                    board.forEach(function (t) {
                        if (t.company === c) {
                            t.company = largestComp;
                            neighbors.push(t);
                            companies[largestComp].size++;
                        }
                    })
                });
                thisTile.company = largestComp;
                companies[largestComp].size++;
                neighbors.push(thisTile);

                socket.emit('selectTile', { tiles: neighbors, board: board, companies: companies});
                neighbors = [];
                thisTile = null;

            } else if (comp) {
                thisTile.company = comp;
                companies[thisTile.company].size++;
                neighbors.forEach(function (n) {
                    if (n.company !== comp) {
                        n.company = comp;
                        companies[thisTile.company].size++;
                    }
                })

                neighbors.push(thisTile);
                socket.emit('selectTile', { tiles: neighbors, board: board, companies: companies});
                neighbors = [];
                thisTile = null;
            } else {
                // surrounded by not corporate tiles
                $('#gameboard').hide()
                $('#corpSelectList').show()
            }
        } else if (neighbors.length === 1) {
            // check if corporation established
            if (neighbors[0].company) {
                // add to existing corporation
                thisTile.company = neighbors[0].company;
                companies[thisTile.company].size++;
                neighbors.push(thisTile);
                socket.emit('selectTile', { tiles: neighbors, board: board, companies: companies});
                neighbors = [];
                thisTile = null;
            } else {
                // create new corporation
                $('#gameboard').hide()
                $('#corpSelectList').show()
            }

        } else {
            neighbors.push(thisTile);
            socket.emit('selectTile', { tiles: neighbors, board: board, companies: companies});
            neighbors = [];
            thisTile = null;
        }

        $('#' + targetId).css('border', 'solid white 1px');

        $('#stockPurchase').show();

        for( var i = 0; i < 6 ; i++){
            if(user.tiles[i].x + '' + user.tiles[i].y === targetId ) {
                user.tiles.splice(i, 1);
                break;
            }
        }

        user.tiles.indexOf({})
        $.get('/newTile').then(function (tile) {
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

        $('#totalPurchase').text(purchaseOrder.total)

    })

    socket.on('updateTile', function (data) {
        data.tiles.forEach(function(tile){
            $('#'+ tile.x + '' + tile.y).css('background', tile.company || 'white');
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