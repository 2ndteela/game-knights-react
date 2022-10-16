import { Button, Input } from "antd";
import {useState} from 'react'
import { useSearchParams, useNavigate } from "react-router-dom";


export default function JoinGame() {

    const [ gameCode, setGameCode ] = useState()
    const [ screenName, setScreenName ] = useState()
    const [search] = useSearchParams()
    const navigate = useNavigate()

    function joinGame() {
        const game = search.get('game')

        if(!game) alert("What type of game are your joining? Try going back to the home page and selecting your game again")
        else navigate(`/${game}`)
    }

    return (
        <div className="route-container center-up" style={{justifyContent: 'center'}}>
            <span style={{width: '100%'}}>Game Code</span>
            <Input size="large" value={gameCode} onChange={e => setGameCode(e.target.value)} />
            <br/>
            <span style={{width: '100%'}}>Screen Name</span>
            <Input size="large" value={screenName} onChange={e => setScreenName(e.target.value)} />
            <br/>
            <div style={{alignItems: "flex-end", width: '100%'}}>
                <Button type="primary" onClick={joinGame}>Join Game</Button>
            </div>
        </div>
    )
}