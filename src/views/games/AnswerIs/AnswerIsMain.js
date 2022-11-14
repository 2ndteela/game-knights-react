import { Button, Input } from 'antd'
import React, {useState, useMemo, useEffect} from 'react'
import { awardPoint, listenForGameUpdates, removeListener, setAnswerForRound, setGameState, setQuestionForUser } from '../../../ultilites/services'
import { getGameStates, getStoredGameData, whoAmIWaitingOn } from '../../../ultilites/utilities'
import './AnswerIsStyles.less'

export default function AnswerIsMain() {
    const gameStates = getGameStates('ai')
    const {playerId} = getStoredGameData()
    const {TextArea} = Input

    const [ gameData, setGameData ] = useState()
    const [ response, setResponse ] = useState()
    const [ listener, setListener ] = useState()
    const [ responded, setResponded ] = useState(false)
    const [ waitingList, setWaitingList ] = useState([])
    

    const view = useMemo(() => {
        const isPicker = playerId === gameData?.picker

        if(!gameData) return 'loading'

        if(gameData.state === gameStates.writingAnswer || gameData.state === gameStates.started) {
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
                console.log('got update', data)
                if(data.state === gameStates.ended) {
                    if(listener) removeListener(l)
                }
    
                else {
                    const isPicker = playerId === data?.picker
                    
                    if(!listener) setListener(l)

                    if(gameStates.writingQuestions && data.players[playerId].question)
                        setResponded(true)

                    if((responded || isPicker) && data.state !== gameStates.results) {
                        const waitingListCheck = whoAmIWaitingOn(data)
                        console.log(waitingListCheck)
                        if(!waitingListCheck.length && isPicker) {
                            setGameState(gameStates.picking)
                            data.state = 'picking'
                        }

                        else if(waitingListCheck.length) setWaitingList(waitingListCheck)
                    }
          
                    setGameData(data)
                }
    
            })
        }
        if(!listener) f()
    }, [gameStates, listener, playerId, responded, waitingList])

    async function setAnswer() {
        const resp = await setAnswerForRound(response)
        if(resp) {
            setResponse('')
            setGameState(gameStates.writingQuestions)

        }
        else alert("There has been an error saving your answer, please try again")

    }

    async function setQuestion() {
        const resp = setQuestionForUser(response)
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
        }
        else alert('There was an error saving your pick, please try again')
    }

    async function goToNextRound() {
        setGameState('')
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
                </>
            )}
            {
                view === 'waitingOnAnswer' && (
                    <>
                        <span>Waiting on the Answer</span>
                    </>
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
                        <div style={{height: '8px'}}></div>
                        <div style={{display: 'flex', alignItems: 'flex-end', width: '100%'}} ><Button type="primary" onClick={setQuestion}>Submit</Button></div>
                    </>
                )
            }
            {
                view === 'waitingOnQuestions' && (
                    <>
                        <span>Waiting on the Questions from</span>
                        <div>{waitingList.map(p => <h4>{p}</h4>)}</div>
                    </>
                )
            }
            {
                view === 'pick' && (
                    <>
                        {gameData.players.map((p, itr) => {
                            if(p.question) return <Button style={{width: '100%', backgroundColor: '#434343'}} onClick={() => pickWinner(itr)} >{p.question}</Button>
                            return null
                        })  }
                    </>
                )
            }
            {
                view === 'waitingInPick' && (
                    <>
                    <div>You answered {gameData.players[playerId].question}</div>
                    <div>Here is what everyone else answered: </div>
                    {gameData.players.map((p, itr) => {
                            if(p.question && itr !== playerId ) return <div className='answer-from-other'>{p.question}</div>
                            return null
                        })  }
                    </>
                )
            }
            {
                view === 'results' && (
                    <>
                        {gameData.players.map(p => {
                            if(p.points) return <div>{p.name}: {p.points}</div>
                            return <div>{p.name}: 0</div>
                        })}
                        <Button onClick={goToNextRound} >Next Round</Button>
                    </>
                )   
            }
        </div>
    )
}