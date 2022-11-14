import { Input, Button, Progress } from "antd";
import { useState, useMemo, useEffect } from "react";
import { checkForEndOfHsssGame, listenForGameState, removeListener, saveHsssResponse, setGameFinished } from '../../../ultilites/services'
import { writeToLocalStorage, getFromLocalStorage, getGameStates } from "../../../ultilites/utilities";
import { useNavigate } from "react-router-dom";
import './he-said-she-said-styles.less'

const prompts = [
    {
        mainTextOptions: ["Write a boy's name", "Gimme a boy's name", "What's the a guy's name?"],
    },
    {
        mainTextOptions: ["Now a girl's name", "And now a girl", "Write a girl's name"]
    },
    {
        mainTextOptions: ["Where are they?", "Where is the story taking place?", "Where are they at?"],
    },
    {
        mainTextOptions: ['What are they doing?', 'What are they doing there?', "What's happening?"],
    },
    {
        mainTextOptions: ['The guy speaks up and says', 'The boy says', 'The guy says', 'The guy speaks first and says']
    },
    {
        mainTextOptions: ['The girl responds', 'Then the girl says', 'The girl speaks up and says']
    },
    {
        mainTextOptions: ['The boy responds', 'Now the boy speaks again', 'The boy then says']
    },
    {
        mainTextOptions: ['The girl responds', 'Finally, the girl says', 'In closing, the girl says']
    },
    {
        mainTextOptions: ["What's the moral of the story?", 'The moral of the story is', 'What did we learn from this story?']
    },
    {
        mainTextOptions: ['Now give it a hashtag', "What's the hashtag?", 'What is the hashtag on of the story']
    }
]

export default function HeSaidSheSaidMain() {
    const gameStates = getGameStates('hsss')
    const stepCheck = getFromLocalStorage('hsssStep')
    const [ step, setStep ] = useState(stepCheck ? parseInt(stepCheck) : 0)
    const [ response, setResponse ] = useState()
    const [ listener, setListener ] = useState(null)
    const [ progress, setProgress ] = useState(100)
    const [ tick, setTick ] = useState(false)

    const navigate = useNavigate()
    
    const currentQuestion = useMemo(() => {
        if(step > prompts.length) return null
        const current = prompts[step]
        return current
    },[step])

    const currentQuestionText = useMemo(() => {

        if(!currentQuestion) return null

        const count = currentQuestion.mainTextOptions.length
        const pick = Math.floor(Math.random() * count)

        return currentQuestion?.mainTextOptions[pick]
    }, [currentQuestion])

    const listenForGameEnd = useMemo(() => {
        listenForGameState((data, l) => {
            if(data === gameStates.ended) {
                if(listener)
                    removeListener(listener)
                
                navigate('/hsss-results')
            }
            else {
                if(!listener) setListener(l)
            }
        })
    }, [gameStates, listener, navigate])

    const barColor = useMemo(() => {
        if (progress > 50 ) 
            return '#177ddc' 

        if (progress > 30) 
            return '#fff44fbb' 

        return '#ff0000bb'
    }, [progress])

    useEffect(() => {
        async function f() {
            if(step === 10) {
                const endOfGameCheck = await checkForEndOfHsssGame()
                if(endOfGameCheck) setGameFinished()
                if(step === 10)listenForGameEnd()
            }
        }
        f()
    }, [listenForGameEnd, step])

    useEffect(() => {
        if(!tick) {
            if(step < 10 )setTimeout(() => setTick(true), 333)
        }
        
        else {
            if(progress > 0) setProgress(progress - 1)
            else writeAnswer()

            setTick(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    async function writeAnswer() {
        const r = !response ? "REDACTED" : response
        saveHsssResponse(r, step)
        const nextStep = step + 1
        writeToLocalStorage('hsssStep', nextStep)
        setStep(nextStep)
        setResponse('')
        setProgress(100)
        setTick(false)
    }

    return(
        <div className="route-container" id="hsss-main-wrapper">
            { step > 9 && (
                <div>
                    <h2>Waiting on your friends</h2>
                </div>
            )}
            { step <= 9 && (
            <div style={{width: '100%'}}>
                <span style={{paddingBottom: '4px'}} >{currentQuestionText}</span>
                <Input
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                />
                <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} trailColor="#434343" />
                <div id="buttons-container">
                    <Button type="primary" onClick={writeAnswer} disabled={!response}>Next</Button>
                </div>
            </div>

            )}
        </div>
    )
}