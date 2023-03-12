import { Button } from "antd";
import {useNavigate} from 'react-router-dom'
import './view-styles.less'
import React, {useState} from 'react'

export default function Home() {
    const navigate = useNavigate()

    const [ showMessage, setShowMessage ] = useState(true)

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
                <div id='home-message-container' className={`${showMessage ? '' : 'hidden-message'}`} >
                    <div id="home-message">
                        <p>
                            Hey everyone! This is Jeremy, the author of Game Knights. 
                            This project has been a passion of mine for a while now, and I'm humbled and happy to hear people I don't even know
                            have been enjoying these games. I can't say how awesome that is!
                        </p>
                        <p>
                            Some of you have told me you'd like to donate to say your thanks, and while I never intended to make money off of this
                            project, I'm not against the idea. If you want to send me some love, here is a link to my <a href="https://venmo.com/u/Jeremy-Teela">Venmo</a>. 
                        </p>
                        <p>
                            Thank you again for playing my games and sharing your joy with me!
                        </p>
                        <div style={{display: 'flex', alignItems: 'flex-end', width: '100%'}} >
                            <Button type="primary" onClick={() => setShowMessage(false)} >Dismiss</Button>
                        </div>
                    </div>
                </div>
            </div>
    )
}