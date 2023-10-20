import React, {useState, useEffect, useRef} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
var myChar;
export default function Game(){
  const [squares, setSquares] = useState([Array(9).fill("")]);
  const [nextPlayer, setNextPlayer] = useState("X");
  const [gameOn, setGameOn] = useState(true);
  const [winner, setWinner] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  
  const [waitForApproval, setWaitForApproval] = useState(false);      // true if this client sends request to the second client to play again
  const [requestToJoin, setRequestToJoin] = useState(false);          // true if this client has gotten a request to play again 
 
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state.name;
  
  useEffect(()=>{
      getMyChar(name);
      const intervalId = setInterval(getCurrPlayer, 100); 

        // Return a cleanup function to clear the interval when the component unmounts
      return () => clearInterval(intervalId);

  }, []);

  // Reading from the server data about: 
  //1. who has the next turn 
  //2. the current game board 
  //3. if the board is full 
  //4. if there is a winner (and the winner name)
  //5. if the other player wants a new game
  //6. if the other player accepts/rejects the new game invitation 
  //7. The name of the player that wants a new game
  async function getCurrPlayer(){

      try {
        const response = await fetch(`http://localhost:3002/currentPlayer`)
        .then((res) => res.json())
        .then((res) => {
                   
          const newBoard = res.board;
          setSquares(prev => newBoard);
          setNextPlayer(res.currentPlayer);
          if (res.winnerPlayer != false){
            setWinner(true);
            setWinnerName(res.name);
            setGameOn(false);
          }
          else if (res.fullBoard == true){
            setWinner(false);
            setGameOn(false);
          }
          if (res.request == true && res.reqSender != name){
            if (waitForApproval == false && requestToJoin == false){
              setRequestToJoin(true);
            }
          }
          if (res.accept == true){
            newGame();
          }
          if (res.reject == true){
            setWaitForApproval(false);
            setRequestToJoin(false);
          }
      })
      .catch((error)=>{
          console.log("can't get response from http://localhost:3002/currentPlayer. Here is the error: " + error);
      });
  }
    catch(error){
      console.log("failed to fetch from http://localhost:3002/currentPlayer. here is the error: " + error);         
    }
  }

  // This player asks the server what is his game char ('x' or 'o')
  async function getMyChar(name){
    var char;
    
    try{
      const response = await fetch(`http://localhost:3002/charOfUser`, {
        method: "POST",
        mode: "cors", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({name : name}), 
    })
      .then(res => res.json())
      .then(res => {
          myChar = res.char;
      })
      .catch((error)=>{
          
          console.log("can't get response from http://localhost:3002/charOfUser. Here is the error: " + error);
      });
  }
    catch(error){
      console.log("failed to fetch from http://localhost:3002/charOfUser. here is the error: " + error);         
    }
    
  }

  // Refreshing all game parameters in order to start a new game
  function newGame(){

    setSquares([Array(9).fill("")]);
    setNextPlayer("X");
    setGameOn(true);
    setWinner(false);
    setWinnerName("");
    setWaitForApproval(false);
    setRequestToJoin(false);
  }

  //This function tells the server that this player wants a new game, then the server tells it to the other player
  async function handleNewGameClick(){
    
    try {
      const response = await fetch(`http://localhost:3002/newGameRequest`, {
        method: "POST",
        mode: "cors", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({request : true, nameOfUser : name}), // body data type must match "Content-Type" header  
    })
    .then(res => res.json())
    .then(res => {
      if (res.success == true){
        setWaitForApproval(true);
      }
    })
    .catch((error)=>{
      console.log("can't get response from http://localhost:3002/newGameRequest. Here is the error: " + error);    
    });

    }
    catch (error){
      console.log("failed to fetch from http://localhost:3002/newGameRequest. here is the error: " + error);
    }


  }

  function changeWaitForApproval(){
      return new Promise((resolve, reject)=>{
        setWaitForApproval(true);
        resolve();
    
    });
  }

  // Telling the server that this users accepts the new game invitation
  async function handleAcceptClick(){
    try {
      const response = await fetch(`http://localhost:3002/userChoice`, {
        method: "POST",
        mode: "cors", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({accept : true, reject : false}),
    })
      .then(res => res.json())
      .then((res)=>{
        if (res.success == true){
          
          newGame();
        }
      })
      .catch((error)=>{
        console.log("can't get response from http://localhost:3002/userChoice. Here is the error: " + error);
      });
    }
    catch (error){
      console.log("failed to fetch from http://localhost:3002/userChoice. Here is the error: " + error);
    }
  }

// Telling the server that this users rejects the new game invitation
  async function handleRejectClick(){
    try {
      const response = await fetch(`http://localhost:3002/userChoice`, {
        method: "POST",
        mode: "cors", 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({accept : false, reject : true}), // body data type must match "Content-Type" header  
    })
      .then(res => res.json())
      .then((res)=>{
        if (res.success == true){
          setWaitForApproval(false);
          setRequestToJoin(false);
        }
      }
        
      )

      .catch((error)=>{
        console.log("can't get response from http://localhost:3002/userChoice. Here is the error: " + error);
      });
    }
    catch (error){
      console.log("failed to fetch from http://localhost:3002/userChoice. Here is the error: " + error);
    }
  }

  // If this the user's turn, it sends the server the updated board and then the server sends it to the other player
  async function handleClick(event){
    
      if (myChar == nextPlayer && gameOn){
        const id = event.target.name;
        try{
          const response = await fetch(`http://localhost:3002/gameTurn`, {
            method: "POST",
            mode: "cors", 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({userName : name, index : id}), // body data type must match "Content-Type" header
        })
          .then(res => res.json())
          .then(res => {
            if (res.success){
              const newBoard = res.board;
              setSquares(prev => newBoard);
              if (res.winnerPlayer != false){
                setGameOn(false);
                setWinner(true);
                setWinnerName(name);
              }
              else {
                event.target.dataset.value = nextPlayer;
                if (nextPlayer == "X"){
                  
                  setNextPlayer("O");
                }
                else {
                  setNextPlayer("X");
                }
              }

            }
          })
          .catch((error)=>{
            console.log("can't get response from http://localhost:3002/gameTurn. Here is the error: " + error);
          });
      }
        catch(error){
          console.log("failed to fetch from http://localhost:3002/gameTurn. here is the error: " + error);         
        }
      }
  }

  return (
    <div className="game">
      <Board cells = {squares} handleClick = {handleClick}/>
      <div className = "buttons details">
        <div className ="row">
          {gameOn && <div className = "nextPlayer">Next player: {nextPlayer}</div>}
          {winner && <div className = "outer"> <div className = "winMessage" >{winnerName} is the winner!</div> <button className = "newGame" onClick = {handleNewGameClick}> New Game</button></div>}
          {!winner && !gameOn && <div> <div className = "fullBoard">The board is full! There is no winner in this game</div>  
          <button className = "newGame" onClick = {handleNewGameClick}> New Game</button> </div>}
        </div>
        <div className= "row">
          {waitForApproval && <div className = "waitForOtherPlayer">Waiting for the other player to join...</div>}
          {requestToJoin && <NewGameRequest accept = {handleAcceptClick} reject = {handleRejectClick}/>}
        </div>
      </div>
    </div>
  );

}
function NewGameRequest(props){
  return (
    <div className = "newGameRequest">
      <p>Your opponent wants to play again!</p>
      <button className = "accept" onClick = {props.accept}>Accept</button>
      <button className = "reject" onClick = {props.reject}>Reject</button>
    </div>
  );
}

 function Board(props){

    return (
      <div className = "buttons extra">
        <div className = "row">        
          <button className = "button" data-value={props.cells[0]} name = {0} onClick = {props.handleClick}>{props.cells[0]}</button>
          <button className = "button" data-value={props.cells[1]} name = {1} onClick = {props.handleClick}>{props.cells[1]}</button>
          <button className = "button" data-value={props.cells[2]} name = {2} onClick = {props.handleClick}>{props.cells[2]}</button>
        </div>
        <div className = "row">        
          <button className = "button" data-value={props.cells[3]} name = {3} onClick = {props.handleClick}>{props.cells[3]}</button>
          <button className = "button" data-value={props.cells[4]} name = {4} onClick = {props.handleClick}>{props.cells[4]}</button>
          <button className = "button" data-value={props.cells[5]} name = {5} onClick = {props.handleClick}>{props.cells[5]}</button>
        </div>
        <div className = "row">        
          <button className = "button" data-value={props.cells[6]} name = {6} onClick = {props.handleClick}>{props.cells[6]}</button>
          <button className = "button" data-value={props.cells[7]} name = {7} onClick = {props.handleClick}>{props.cells[7]}</button>
          <button className = "button" data-value={props.cells[8]} name = {8} onClick = {props.handleClick}>{props.cells[8]}</button>
        </div>
      </div>
    );
 }