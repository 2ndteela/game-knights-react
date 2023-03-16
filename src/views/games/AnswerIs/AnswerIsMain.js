import { Button, Input, Progress } from 'antd'
import React, {useState, useMemo, useEffect} from 'react'
import { 
    awardPoint, 
    listenForGameUpdates, 
    removeListener, 
    setAnswerForRound, 
    setGameState, 
    setQuestionForUser, 
    voteToContinue 
} from '../../../ultilites/services'
import { getFromLocalStorage,
    getGameStates, 
    getStoredGameData, 
    makeRandomAIAnswer, 
    whoAmIWaitingOn, 
    writeToLocalStorage 
} from '../../../ultilites/utilities'
import { ArrowRightOutlined } from '@ant-design/icons'
import './AnswerIsStyles.less'
import { useNavigate } from 'react-router-dom'

export default function AnswerIsMain() {
    const gameStates = getGameStates('ai')
    const {playerId} = getStoredGameData()
    const {TextArea} = Input
    const navigate = useNavigate()

    const [ gameData, setGameData ] = useState()
    const [ response, setResponse ] = useState()
    const [ listener, setListener ] = useState()
    const [ responded, setResponded ] = useState(false)
    const [ waitingList, setWaitingList ] = useState([])
    const [ progress, setProgress ] = useState(100)
    const [ tick, setTick ] = useState(false)
    const [ votedToContinue, setVotedToContinue ] = useState(false)
    

    const view = useMemo(() => {
        console.log(gameData, playerId)
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
    }, [gameData, gameStates, playerId, responded])

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

                    if(gameStates.writingQuestions && data.players[playerId].question)
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
    }, [gameData, gameStates, listener, playerId, responded, waitingList])

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
            setTimeout(() => setTick(true), 1000)
        }
        
        else {
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    const barColor = useMemo(() => {
        if (progress > 50 ) 
            return '#177ddc' 

        if (progress > 30) 
            return '#fff44fbb' 

        return '#ff0000bb'
    }, [progress])

    const sortedPlayers = useMemo(() => {
        if(!gameData) return []
        if(!gameData.players) return []
        
        const sorted =  gameData.players.sort((a, b) => {
            if(a.points && !b.points) return -1
            else if (!a.points && b.points) return 1
            else if (a.points > b.points) return -1
            else if (a.points < b.points) return 1
            return 0
        })
        return sorted
    }, [gameData])

    const winner = useMemo(() => {
        if(!gameData) return null
        return gameData.players.find(p => p.points === gameData.pointsToWin)
    }, [gameData])

    async function voteToGoToNextRound() {
        writeToLocalStorage('ai-voted', true)
        const voted = await voteToContinue()
        if(voted) setVotedToContinue(true)
    }

    function goHome() {
        navigate('/')
    }

    return (
        <div className='route-container' id="answer-is-responses">
            {view === 'answering' && (
                <>
                    <span style={{paddingBottom: '4px'}} >What is your answer?</span>
                    <Input.Group compact>
                        <Input value={response} onChange={e => setResponse(e.target.value)} style={{ width: 'calc(100% - 74px)' }} />
                        <Button type="primary" onClick={setAnswer}>Submit</Button>
                    </Input.Group>
                    <br />
                    <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} trailColor="#434343" />
                </>
            )}
            {
                view === 'waitingOnAnswer' && (
                    <div className='waiting-div'>
                        <h1 style={{width: '100%', textAlign: 'center'}}>Waiting on the Answer</h1>
                        <span>(Aren't we all though?)</span>
                    </div>
                )
            }
            {
                view === 'questions' && (
                    <>
                        <span>The Answer is <b>{gameData?.answer ? gameData.answer : "Answer has failed"}</b></span>
                        <div style={{height: '8px'}}></div>
                        <span>What's the Question?</span>
                        <div style={{height: '4px'}}></div>
                        <TextArea value={response} onChange={e => setResponse(e.target.value)} />
                        <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} trailColor="#434343" />
                        <div style={{height: '8px'}}></div>
                        <div style={{display: 'flex', alignItems: 'flex-end', width: '100%'}} ><Button type="primary" onClick={setQuestion}>Submit</Button></div>
                    </>
                )
            }
            {
                view === 'waitingOnQuestions' && (
                    <div className='waiting-div' >
                        <span style={{paddingBottom: '8px'}} >Waiting on the Questions from</span>
                        <div>{waitingList.map(p => <h3>{p}</h3>)}</div>
                    </div>
                )
            }
            {
                view === 'pick' && (
                    <div style={{justifyContent: 'flex-start', width: '100%', height: '100%'}} > 
                        <h1>Answer: {gameData.answer}</h1>
                        <span style={{paddingBottom: '8px', paddingTop: '36px'}} >Pick the question that you like best for your answer:</span>
                        {gameData.players.map((p) => {
                            if(p.question) return (
                                <div style={{paddingBottom: '8px', width: '100%'}} key={p.id} >
                                    <Button style={{width: '100%', backgroundColor: '#434343'}} onClick={() => pickWinner(p.id)} >{p.question}</Button>
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
                        <h3 className='you-answered' >You answered <b>{gameData.players[playerId].question}</b></h3>
                        <div style={{paddingBottom: '8px'}} >Here is what everyone else answered: </div>
                        {gameData.players.map((p, itr) => {
                                if(p.question && itr !== playerId ) return <div className='answer-from-other'>{p.question}</div>
                                return null
                            })  }
                    </div>
                )
            }
            {
                view === 'results' && !winner && (
                    <div id="leader-board">
                        <div style={{width: '100%'}} >
                            <div id="results-header">
                                <h1>Leader Board</h1>
                                <h3>Game to: {gameData.pointsToWin}</h3>
                            </div>
                            {sortedPlayers.map((p, itr) => {
                                if(p.points) return <h3 style={{ color: itr === gameData?.recentWinner ? 'deepskyblue': 'white'}} >{p.name}: {p.points}</h3>
                                return <h3>{p.name}: 0</h3>
                            })}
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
                <div style={{width: '100%', alignItems: 'center'}} >
                    <h1 style={{width: '100%', textAlign: 'center', color: 'deepskyblue' }} >{winner.name} Wins!</h1>
                    <br />
                    <Button onClick={goHome} size="large" >Return to Home</Button>
                </div>
            )}
        </div>
    )
}