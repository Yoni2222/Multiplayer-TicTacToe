
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    // Log the error
    console.log(err.stack);
  

  });
  

var numOfPlayers = 0;                       
var currPlayer = "X";
var winner = false;                         // true if there is a winner in the game
var full = false;                           // true if the board is full

var nameOfRequestSender = "";               // name of new game sender
var newGameRequest = false;                 // true if one of the players wants a new game
var newGameApproval = false;                // true if the second player approves the new game request
var newGameRefusal = false;                 // true if the second player rejects the new game request
var numOfNotifiedClients = 0;               // a variable that helps the server to know when to refresh 
                                            //all his parameters, when it's 1, it's the time to refresh all the parameters
var gameBoard = Array(9).fill("");
var players = [
    {
        name:"",
        sign:"X"
    },
    {
        name:"",
        sign:"O"
    }
]

// telling the client how many players registered
app.get("/gameStatus", async (req, res)=>{
    //console.log("hello2");
    res.json({num : numOfPlayers});
});



//telling the clients who has the next turn, sending the current board, sending if the board is full, sending if there is a winner and his name
// telling if one of the player wants new game, telling if the second player accepts/rejects the new game invitation and the name of the player that wants a new game.
app.get("/currentPlayer", async (req, res)=>{

    if (winner != false){
        var winnerName = getWinnerName(players, winner);
       
        res.json({currentPlayer: currPlayer, board: gameBoard, winnerPlayer : winner, 
            fullBoard: full, name : winnerName, request : newGameRequest, accept : newGameApproval, reject : newGameRefusal, 
            reqSender : nameOfRequestSender});

    }
    else {
        res.json({currentPlayer: currPlayer, board: gameBoard, winnerPlayer : winner, fullBoard: full, 
            request : newGameRequest, accept : newGameApproval, reject : newGameRefusal, reqSender : nameOfRequestSender});
    }
    if (newGameApproval == true){
        if (numOfNotifiedClients == 1)
            refreshAllParameters();
        else if (numOfNotifiedClients < 1)
            numOfNotifiedClients++;
    }
    
});

//registration
app.post("/users/:name", async (req, res)=> {
    console.log("hello");
    console.log(numOfPlayers);
    if (numOfPlayers < 2){
        
        if (players[0].name == ""){
            players[0].name = req.params.name;

        }
        else if (players[1].name == ""){
            players[1].name = req.params.name;
            
        }
        console.log(players[0].name);
        console.log(players[1].name);
        numOfPlayers++;
        res.json({ num : numOfPlayers })
    }
    else{
        res.json({success: false, message: "Cant register"});
    }

});

//telling each player its game char (X or O)
app.post("/charOfUser", async (req, res)=>{

    const userName = req.body.name;
    if (userName == players[0].name){
        res.json({char : players[0].sign});
    }
    else {
        res.json({char : players[1].sign});
    }
    
});

//responding to the player's decision to send rematch invitation to the second player
app.post("/newGameRequest", async (req, res)=>{
    newGameRequest = req.body.request;
    nameOfRequestSender = req.body.nameOfUser;
    res.json({success : true});
    newGameRefusal = false;
    console.log("newGameRequest is " + newGameRequest);
});

//responding to the player's chocice whether he accepts or declines a new game invitation from the second player
app.post("/userChoice", async (req, res)=>{
    if (req.body.accept == true && req.body.reject == false){
        newGameApproval = true;
        res.json({success : true});
        //refreshAllParameters();
    }
    else if (req.body.accept == false && req.body.reject == true){
        newGameRefusal = true;
        res.json({success : true});
    }
    else {
        res.json({success : false});
    }
});

// responding to the player's turn
app.post("/gameTurn", (req, res)=> {
    
    const clientName = req.body.userName;
    const index = req.body.index;

        if (clientName == players[0].name){
            if (players[0].sign == currPlayer){
                if (gameBoard[index] == ''){

                    gameBoard[index] = currPlayer;
                    winner = checkForWinner(gameBoard);
                    if (winner === false){
                        full = checkForFullBoard(gameBoard);
                    }
                    if (winner === false && full == false) {
                        currPlayer = 'O';
                    }
                    res.json({ success: true, board: gameBoard, winnerPlayer : winner, fullBoard: full});
                    
                }
                else {
                    res.json({ success: false, message: "This cell is occupied"});
                }
            }
            else {
                res.json({ success: false, message: "Not your turn"});
            }

        }
        else if (clientName == players[1].name){
            if (players[1].sign == currPlayer){
                if (gameBoard[index] == ''){

                    gameBoard[index] = currPlayer;
                    winner = checkForWinner(gameBoard);
                    if (winner === false){
                        full = checkForFullBoard(gameBoard);
                    }
                    if (winner === false && full == false){
                        currPlayer = 'X';
                    }
                    res.json({ success: true, board: gameBoard, winnerPlayer : winner, fullBoard: full});
                }
                    
                else {
                    res.json({ success: false, message: "This cell is occupied"});
                }

            }
            else {
                res.json({ success: false, message: "Not your turn" });
            }
        }
});

app.listen(3002, (req, res)=> {
    console.log("Hello! You are listening to port 3002.");
});

function refreshAllParameters(){
    numOfPlayers = 0;
    currPlayer = "X";
    winner = false;
    full = false;
    newGameRequest = false;
    newGameApproval = false;
    newGameRefusal = false;
    gameBoard = Array(9).fill("");

}



function checkForWinner(gameBoard){
    
    if (gameBoard[0] != '') {
        // check first row
        if (gameBoard[0] == gameBoard[1] && gameBoard[1] == gameBoard[2]){
            return gameBoard[0];
        }
        // check first col
        if (gameBoard[0] == gameBoard[3] && gameBoard[3] == gameBoard[6]){
            return gameBoard[0];
        }
        //check secondary diagonal
        if (gameBoard[0] == gameBoard[4] && gameBoard[4] == gameBoard[8]){
            return gameBoard[0];
        }
    }
    // check second col
    if (gameBoard[1] != '' && gameBoard[1] == gameBoard[4] && gameBoard[4] == gameBoard[7]){
        return gameBoard[1];
    }

    // check third col
    if (gameBoard[2] != '' && gameBoard[2] == gameBoard[5] && gameBoard[5] == gameBoard[8]){
        return gameBoard[2];
    }

    // check second row
    if (gameBoard[3] != '' && gameBoard[3] == gameBoard[4] && gameBoard[4] == gameBoard[5]){
        return gameBoard[3];
    } 

    // check third row
    if (gameBoard[6] != '' && gameBoard[6] == gameBoard[7] && gameBoard[7] == gameBoard[8]){
        return gameBoard[6];
    }
    
    // check main diagonal
    if (gameBoard[2] != '' && gameBoard[2] == gameBoard[4] && gameBoard[4] == gameBoard[6]){
        return gameBoard[2];
    }    
    
    return false;
    
}

function checkForFullBoard(gameboard){

    for (let i = 0; i < 9; i++){
        if (gameBoard[i] == '')
            return false;
    }
    return true;
}

function getWinnerName(players, char){
    if (char == players[0].sign){
        return players[0].name;
    }
    else if (char == players[1].sign){
        return players[1].name;
    }
    return null;
}