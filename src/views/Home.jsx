import { Button } from "antd";
import {useNavigate} from 'react-router-dom'
import './view-styles.less'
import React, {useState, useEffect} from 'react'
import { TutorialDialog } from "../components/TutorialDialog/TutorialDialog";
import { getFromLocalStorage, writeToLocalStorage } from "../utilities/utilities";

export default function Home() {
    const navigate = useNavigate()

    // Only ever shown on a player's first visit to the site.
    const [ showMessage, setShowMessage ] = useState(() => !getFromLocalStorage('home-message-seen'))

    // Marked on mount rather than on dismissal, so coming back to the home page
    // between games does not bring the note back.
    useEffect(() => {
        writeToLocalStorage('home-message-seen', true)
    }, [])

    function goToGame(game) {
        navigate(`/join-game?game=${game}`)
    }

    function dismissMessage() {
        setShowMessage(false)
    }


    return(
            <div id="home-container" className="route-container center-up">
                <div className="tutorial-row" >
                    <TutorialDialog />
                </div>
                <Button 
                    block
                    onClick={() => goToGame('hsss')} 
                    className="game-button"
                    size="large"
                >He Said, She Said</Button>
                <div className="spacer-8" />
                <Button 
                    block
                    onClick={() => goToGame('ai')} 
                    className="game-button"
                    size="large"
                >Answer Is</Button>
                <div className="spacer-8" />
                <Button
                    block
                    onClick={() => goToGame('wf')}
                    className="game-button"
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
                        <div className="bottom-action-row" >
                            <Button type="primary" onClick={dismissMessage} >Dismiss</Button>
                        </div>
                    </div>
                </div>
            </div>
    )
}