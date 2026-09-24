import { Button, Input, Progress, Space } from 'antd'
import React, {useState, useMemo, useEffect} from 'react'
import { 
    awardPoint, 
    listenForGameUpdates, 
    removeListener, 
    setAnswerForRound, 
    setGameState, 
    setQuestionForUser, 
    voteToContinue 
} from '../../../utilities/services'
import { getFromLocalStorage,
    getGameStates, 
    getStoredGameData, 
    makeRandomAIAnswer, 
    whoAmIWaitingOn, 
    writeToLocalStorage 
} from '../../../utilities/utilities'
import { ArrowRightOutlined } from '@ant-design/icons'
import './AnswerIsStyles.less'
import { useGoHome } from '../../../hooks/useGoHome'

// Hoisted so the object identity is stable; getGameStates() returns a new object
// per call, which made every hook depending on it re-run on every render.
const gameStates = getGameStates('ai')

export default function AnswerIsMain() {
    const {playerId} = getStoredGameData()
    const {TextArea} = Input

    const [ gameData, setGameData ] = useState()
    const [ response, setResponse ] = useState()
    const [ listener, setListener ] = useState()
    const [ responded, setResponded ] = useState(false)
    const [ waitingList, setWaitingList ] = useState([])
    const [ progress, setProgress ] = useState(100)
    const [ tick, setTick ] = useState(false)
    const [ votedToContinue, setVotedToContinue ] = useState(false)

    const goHome = useGoHome(listener)


    const view = useMemo(() => {
        const isPicker = playerId === gameData?.picker

        if(!gameData) return 'loading'

        if(gameData.state === gameStates.writingAnswer || gameData.state === gameStates.started) {
            if(responded && !isPicker) setResponded(false)
            if(isPicker) return 'answering'
            return 'waitingOnAnswer'
        }
        else if (gameData.state === gameStates.writingQuestions) {
            if(isPicker || responded) return 'waitingOnQuestions'
            return 'questions'
        }
        else if(gameData.state === gameStates.picking) {
            if(isPicker) return 'pick'
            return 'waitingInPick'
        }
        return 'results'
    }, [gameData, playerId, responded])

    useEffect(() => {
        async function f() {
            listenForGameUpdates((data, l) => {
                if(data.state === gameStates.ended) {
                    if(listener) removeListener(l)
                }
    
                else {
                    const isPicker = playerId === data?.picker
                    const voted = getFromLocalStorage('ai-voted')
                    
                    if(!listener) setListener(l)

                    if(gameStates.writingQuestions && data.players?.[playerId]?.question)
                        setResponded(true)

                    if(gameStates.results && voted) setVotedToContinue(true)

                    if((responded || isPicker) && data.state !== gameStates.results) {
                        const waitingListCheck = whoAmIWaitingOn(data)
                        if(!waitingListCheck.length && isPicker) {
                            setGameState(gameStates.picking)
                            data.state = 'picking'
                        }

                        else if(waitingListCheck.length) setWaitingList(waitingListCheck)
                    }

                    if(data?.state !== gameData?.state) {
                        setProgress(100)
                        setTick(false)
                    }

                    setGameData(data)
                }
    
            })
        }
        if(!listener) f()
    }, [gameData, listener, playerId, responded, waitingList])

    async function setAnswer() {
        const resp = await setAnswerForRound(response || '-')
        setVotedToContinue(false)
        writeToLocalStorage('ai-voted', false)
        if(resp) {
            setResponse('')
            setGameState(gameStates.writingQuestions)

        }
        else alert("There has been an error saving your answer, please try again")

    }

    async function setQuestion() {
        const resp = setQuestionForUser(response)
        setVotedToContinue(false)
        writeToLocalStorage('ai-voted', false)
        if(resp) {
            setResponse('')
            setResponded(true)
        }
        else alert("There has been an error saving your answer, please try again")
    }

    async function pickWinner(playerId) {
        const resp = await awardPoint(playerId)
        if(resp) {
            setGameState(gameStates.results)
            setProgress(100)
            setTick(false)
        }
        else alert('There was an error saving your pick, please try again')
    }

    useEffect(() => {
        if(!tick) {
            const timer = setTimeout(() => setTick(true), 1000)
            return () => clearTimeout(timer)
        }

        if(progress > 0) {
            setProgress(progress - 2)
            setTick(false)
        }
        else {
            if(view === 'answering') {
                setResponse(makeRandomAIAnswer())
                setAnswer()
            }

            else if(view === 'questions') {
                setResponse('-')
                setQuestion()
            }
        }
        return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    const barColor = useMemo(() => {
        if (progress > 50 ) 
            return '#177ddc' 

        if (progress > 30) 
            return '#fff44fbb' 

        return '#ff0000bb'
    }, [progress])

    // Sorts a copy, and carries each player's position in the original array
    // along as `idx`. gameData.players comes straight from Firebase and the rest
    // of the game keys players by that position, so sorting it in place used to
    // detach names from their picker/winner/response.
    const sortedPlayers = useMemo(() => {
        if(!gameData?.players) return []

        return gameData.players
            .map((p, idx) => ({...p, idx}))
            .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    }, [gameData])

    const winner = useMemo(() => {
        if(!gameData?.players) return null

        // pointsToWin arrives from an input, so compare numerically and treat
        // overshooting the target as a win too.
        const target = Number(gameData.pointsToWin)
        if(!target) return null

        return gameData.players.find(p => (p.points ?? 0) >= target)
    }, [gameData])

    async function voteToGoToNextRound() {
        writeToLocalStorage('ai-voted', true)
        const voted = await voteToContinue()
        if(voted) setVotedToContinue(true)
    }

    return (
        <div className='route-container' id="answer-is-responses">
            {view === 'answering' && (
                <>
                    <span className="pad-bottom-4" >What is your answer?</span>
                    <Space.Compact className="full-width">
                        <Input value={response} onChange={e => setResponse(e.target.value)} className="answer-input" />
                        <Button type="primary" onClick={setAnswer}>Submit</Button>
                    </Space.Compact>
                    <br />
                    <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} railColor="#434343" />
                </>
            )}
            {
                view === 'waitingOnAnswer' && (
                    <div className='waiting-div'>
                        <h1>Waiting on the Answer</h1>
                        <span>(Aren't we all though?)</span>
                    </div>
                )
            }
            {
                view === 'questions' && (
                    <>
                        <span>The Answer is <b>{gameData?.answer ? gameData.answer : "Answer has failed"}</b></span>
                        <div className="spacer-8"></div>
                        <span>What's the Question?</span>
                        <div className="spacer-4"></div>
                        <TextArea value={response} onChange={e => setResponse(e.target.value)} />
                        <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} railColor="#434343" />
                        <div className="spacer-8"></div>
                        <div className="bottom-action-row" ><Button type="primary" onClick={setQuestion}>Submit</Button></div>
                    </>
                )
            }
            {
                view === 'waitingOnQuestions' && (
                    <div className='waiting-div' >
                        <span className="pad-bottom-8" >Waiting on the Questions from</span>
                        <div>{waitingList.map(p => <h3 key={p}>{p}</h3>)}</div>
                    </div>
                )
            }
            {
                view === 'pick' && (
                    <div className="pick-list" > 
                        <h1>Answer: {gameData.answer}</h1>
                        <span className="pick-prompt" >Pick the question that you like best for your answer:</span>
                        {gameData.players.map((p, itr) => {
                            // Fall back to the array position: that is the key the
                            // database writes points under, and hsss/wf lobbies
                            // never stamped an explicit id on the host.
                            const id = p.id ?? itr
                            if(p.question) return (
                                <div className="pick-option" key={id} >
                                    <Button className="pick-button" onClick={() => pickWinner(id)} >{p.question}</Button>
                                </div>
                            )
                            return null
                        })  }
                    </div>
                )
            }
            {
                view === 'waitingInPick' && (
                    <div className='waiting-on-pick'>
                        <h3 className='you-answered' >You answered <b>{gameData.players?.[playerId]?.question}</b></h3>
                        <div className="pad-bottom-8" >Here is what everyone else answered: </div>
                        {gameData.players.map((p, itr) => {
                                if(p.question && itr !== playerId ) return <div className='answer-from-other' key={p.id ?? itr}>{p.question}</div>
                                return null
                            })  }
                    </div>
                )
            }
            {
                view === 'results' && !winner && (
                    <div id="leader-board">
                        <div className="full-width" >
                            <div id="results-header">
                                <h1>Leader Board</h1>
                                <h3>Game to: {gameData.pointsToWin}</h3>
                            </div>
                            {sortedPlayers.map(p => (
                                <h3
                                    key={p.idx}
                                    className={p.idx === gameData?.recentWinner ? 'player-score recent-winner' : 'player-score'}
                                >{p.name}: {p.points ?? 0}</h3>
                            ))}
                        </div>
                        <Button
                            type='primary'
                            block
                            onClick={voteToGoToNextRound}
                            disabled={votedToContinue}
                        >
                            <span>Ready For Next Round</span>
                            <ArrowRightOutlined />
                            </Button>
                    </div>
                )   
            }
            {view === 'results' && winner && (
                <div className="winner-banner" >
                    <h1 className="winner-name" >{winner.name} Wins!</h1>
                    <br />
                    <Button onClick={goHome} size="large" >Return to Home</Button>
                </div>
            )}
        </div>
    )
}