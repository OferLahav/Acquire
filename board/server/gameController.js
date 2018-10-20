
var activeGames = [];

var companies = {
    blue: { remaining: 20, cap: 'l', size: 0 },
    orange: { remaining: 20, cap: 'l', size: 0 },
    green: { remaining: 20, cap: 'm', size: 0 },
    yellow: { remaining: 20, cap: 'm', size: 0 },
    pink: { remaining: 20, cap: 'm', size: 0 },
    purple: { remaining: 20, cap: 's', size: 0 },
    red: { remaining: 20, cap: 's', size: 0 },
}

function pickTiles(numOfTiles, tiles) {
    var selectedTiles = [];
    for (var i = 0; i < numOfTiles; i++) {
        var index = Math.floor(Math.random() * tiles.length);
        selectedTiles.push(tiles[index]);
        tiles.splice(index, 1);
    }
    return selectedTiles;
}
module.exports = {
    createNewGame: (numOfPlayers) => {
        var board = [];
        var unpickedTiles = [];
        var users = [];

        // create board tiles and unpicked tiles (all)
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                board[i+'_'+j] = {
                    x: i,
                    y: j,
                    filled: false,
                    company: null
                }
                unpickedTiles.push({             
                    id: i + '_' + j,
                    x: i,
                    y: j,
                    filled: false,
                    company: null 
                });
            }
        }
        
        // users
        for (var i = 0; i < numOfPlayers; i++) {
            users[i] = {
                money: 5000,
                stocks: {},
                tiles: pickTiles(6, unpickedTiles)
            }
        }
        var newGame = { 
            id: activeGames.length, 
            numOfActivePlayers: 1, 
            users: users, 
            board: board, 
            unpickedTiles: unpickedTiles,
            companies: companies,
            capacity: parseInt(numOfPlayers)
         };
        activeGames.push(newGame)
        newGame.user = newGame.users[0];
        return newGame;
    },
    logIntoGameByID: (gameID) => {
        var activeGame = activeGames[gameID];
        if (activeGame.numOfActivePlayers >= activeGame.capacity) {
            return null;
        }
        activeGame.numOfActivePlayers += 1;
        activeGame.user = activeGame.users[activeGame.numOfActivePlayers - 1];
        return activeGame;
    },
    getActiveGames: () => {
        return activeGames
    },
    pickATile: (gameID) => {
        return pickTiles(1, activeGames[gameID].unpickedTiles)[0];
    }
};