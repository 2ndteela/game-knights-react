import { Input, Button, Progress } from "antd";
import { useState, useMemo, useEffect } from "react";
import { checkForEndOfHsssGame, listenForGameState, removeListener, saveHsssResponse, setGameFinished } from '../../../utilities/services'
import { writeToLocalStorage, getFromLocalStorage, getGameStates } from "../../../utilities/utilities";
import { useNavigate } from "react-router-dom";
import './he-said-she-said-styles.less'
import loadingSvg from '../../../assets/photos/loading.svg'
import usePrompts from "./usePrompts";


// Hoisted out of the component: getGameStates() builds a fresh object on every
// call, so calling it during render gave every hook that depended on it a new
// identity each time and made them re-run constantly.
const gameStates = getGameStates('hsss')

export default function HeSaidSheSaidMain() {
    const stepCheck = getFromLocalStorage('hsssStep')
    const [step, setStep] = useState(stepCheck ? parseInt(stepCheck) : 0)
    const [response, setResponse] = useState()
    const [progress, setProgress] = useState(100)
    const [tick, setTick] = useState(false)
    const { prompts, loading } = usePrompts()

    const navigate = useNavigate()

    const currentQuestion = useMemo(() => {
        if (step >= prompts.length) return null
        return prompts[step]
    }, [prompts, step])

    const currentQuestionText = useMemo(() => {

        if (!currentQuestion) return null

        const count = currentQuestion.mainTextOptions.length
        const pick = Math.floor(Math.random() * count)

        return currentQuestion?.mainTextOptions[pick]
    }, [currentQuestion])

    const barColor = useMemo(() => {
        if (progress > 50)
            return '#177ddc'

        if (progress > 30)
            return '#fff44fbb'

        return '#ff0000bb'
    }, [progress])

    // Once this player has answered every prompt, wait for everyone else and
    // move to the results as soon as the game is marked finished. Subscribing
    // here (rather than from a memo) means it happens once, and the cleanup
    // tears the listener down instead of stacking a new one up per render.
    useEffect(() => {
        if (loading || step < prompts.length) return

        let cancelled = false
        let activeListener = null

        async function waitForEveryoneElse() {
            const endOfGameCheck = await checkForEndOfHsssGame(prompts.length)
            if (cancelled) return
            if (endOfGameCheck) setGameFinished()

            listenForGameState((data, l) => {
                if (cancelled) {
                    removeListener(l)
                    return
                }

                activeListener = l
                if (data === gameStates.ended) navigate('/hsss-results')
            })
        }

        waitForEveryoneElse()

        return () => {
            cancelled = true
            if (activeListener) removeListener(activeListener)
        }
    }, [loading, navigate, prompts.length, step])

    useEffect(() => {
        if (!tick) {
            if (loading || step >= prompts.length) return undefined

            const timer = setTimeout(() => setTick(true), 1000)
            return () => clearTimeout(timer)
        }

        if (progress > 0) setProgress(progress - 2)
        else writeAnswer()

        setTick(false)
        return undefined
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

    return (
        <div className="route-container" id="hsss-main-wrapper">
            {loading && (
                <div className="waiting-wrapper" >
                    <img src={loadingSvg} alt="loading gif" />
                    <h2>Loading your prompts</h2>
                </div>
            )}
            {!loading && step >= prompts.length && (
                <div className="waiting-wrapper" >
                    <img src={loadingSvg} alt="loading gif" />
                    <h2 className="pad-bottom-4" >Waiting on your friends</h2>
                    <div>The app will automatically take you to the results page when all your friends are finished answering the prompts</div>
                    <br />
                    <Button danger onClick={() => navigate('/hsss-results')} >Go to results without waiting</Button>
                </div>
            )}
            {!loading && step < prompts.length && (
                <div className="prompt-wrapper">
                    <span className="pad-bottom-4" >{currentQuestionText}</span>
                    <Input
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        className="square-input"
                    />
                    <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} railColor="#434343" />
                    <div id="buttons-container">
                        <Button type="primary" onClick={writeAnswer} disabled={!response}>Next</Button>
                    </div>
                </div>

            )}
        </div>
    )
}