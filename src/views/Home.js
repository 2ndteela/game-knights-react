import { Button } from "antd";
import {useNavigate} from 'react-router-dom'
import './view-styles.less'

export default function Home() {

    const navigate = useNavigate()

    function goToHeSaidSheSaid() {
        navigate('/join-game?game=hsss')
    }

    return(
        <div id="home-container" className="route-container center-up">
            <h2>Pick a game to play</h2>
            <Button type="primary" onClick={goToHeSaidSheSaid} >He Said, She Said</Button>
        </div>
    )
}