import { Button } from "antd";
import {useNavigate} from 'react-router-dom'
import './view-styles.less'

export default function Home() {
    const navigate = useNavigate()

    function goToGame(game) {
        navigate(`/join-game?game=${game}`)
    }


    return(
            <div id="home-container" className="route-container center-up">
                <Button 
                    block
                    onClick={() => goToGame('hsss')} 
                    style={{backgroundColor: '#323232', borderColor: '#323232'}}
                    size="large"
                >He Said, She Said</Button>
                <div style={{height: '8px'}} />
                <Button 
                    block
                    onClick={() => goToGame('ai')} 
                    style={{backgroundColor: '#323232', borderColor: '#323232'}}
                    size="large"
                >Answer Is</Button>
                <div style={{height: '8px'}} />
                <Button
                    block
                    onClick={() => goToGame('wf')}
                    style={{backgroundColor: '#323232', borderColor: '#323232'}}
                    size="large"
                >Word Fight</Button>
            </div>
    )
}