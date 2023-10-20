import React, {useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';

export default function Menu(){
    const [name, setName] = useState("");
    const [allPlayersRegistered, setAllPlayersRegistered] = useState(false);
    const [hasToShowWaitMessage, setHasToShowWaitMessage] = useState(false);
    const nameRef = useRef(name);
    const navigate = useNavigate();

    useEffect(() => {
        // Update the ref whenever 'name' changes
        nameRef.current = name;
        
    }, [name]);

    useEffect(()=>{
        const intervalId = setInterval(getStatus, 1000); 

        // Return a cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    // This function asks constantly the server if all the players registered to the game. if so, then it will navigate to the game screen
    async function getStatus(){
        try {

            const response = await fetch(`http://localhost:3002/gameStatus`)
            .then((res) => res.json())
            .then(res => {
                if (res.num == 2){
                    setAllPlayersRegistered(true);
                    navigate('/game', {
                        state: {
                           name : nameRef.current
                        }
                    });
                }
                else {
                    setAllPlayersRegistered(false);
                }
            })
            .catch((error)=>{
                console.log("can't get response from http://localhost:3002/gameStatus. Here is the error: " + error);
            });
        }
        catch(error){
            console.log("failed to fetch from http://localhost:3002/gameStatus. here is the error: " + error);         
        }

        return null;
    }

    
    async function handleChange(event){
        
        try{
            await setNameOfPlayer(event.target.value);
        }
        catch(error){
            console.log("failed performing 'setNameOfPlayer', here is the error " + error);
        }
    }

    //This function sets the name of this player
    function setNameOfPlayer(val){
        
        return new Promise((resolve, reject)=>{
            setName(val);
            resolve();
        });
    }

    function updatePlayersState(val){
        
        return new Promise((resolve, reject)=>{
            setAllPlayersRegistered(val);
            resolve();
        });
    }

    //Event handler for submit button click
    async function handleSubmit(){
        try {
            const response = await fetch(`http://localhost:3002/users/${name}`, {
                method: "POST", 
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then(res => {
                if (res.num == 2){
                   
                        setAllPlayersRegistered(true);
                }
                else{
                    setAllPlayersRegistered(false);
                    setHasToShowWaitMessage(true);

                }
                
            })
            .catch((error)=>{
                console.log("can't get response from http://localhost:3002/users/userName. Here is the error: " + error);
            });
            
        }
        catch(error){
            console.log("failed to fetch from http://localhost:3002/users/userName. Here is the error: " + error);
        }

    }

    return (
    <div className = "menu">
        <h1 className = "title">Tic-Tac-Toe</h1>
        <h2 className = "subTitle">Please enter your name:</h2>
        <input className = "inputArea" onChange={handleChange} name="userName" ></input>
        <button className = "submitButton" onClick={handleSubmit}>Submit</button>
        {hasToShowWaitMessage && <div className = "waitMessage">Please wait for your opponent to join... </div>}
    </div>
  );    
}

