import { CheckOutlined } from '@ant-design/icons'
import { Input, Button, message, Progress } from 'antd'
import {useState, useMemo, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { checkStringForRealWord, listenForGameUpdates, markWordGuessed, removeListener, setWord, startNextRound } from '../../../ultilites/services'
import { createHiddenWord, getFromLocalStorage, getStoredGameData, removeFromLocalStorage, writeToLocalStorage, cleanStoredData } from '../../../ultilites/utilities'
import './WordFightStyles.less'

export default function WordFightMain() {
    const [messageApi, contextHolder] = message.useMessage();
    const {playerId} = getStoredGameData()
    const initialList = getFromLocalStorage('wf-previousGuesses')

    const [ guess, setGuess ] = useState()
    const [ gameData, setGameData ] = useState()
    const [ guessList, setGuessList ] = useState(initialList ? initialList : [])
    const [ listener, setListener ] = useState()
    const [ wordError, setWordError ] = useState(false)
    const [ finishedGuessing, setFinishedGuessing ] = useState(false)
    const [ progress, setProgress ] = useState(100)
    const [ tick, setTick ] = useState(false)
    const navigate = useNavigate()

    const view = useMemo(() => {
        if(!gameData) return 'fetching'
        if(gameData.state === 'ended') return 'ended'
 
        if(playerId === gameData.picker || (!gameData.picker && playerId === 0  )) 
            if(!gameData.word) return 'picker'
            else return 'waitingOnGuess'
        if(playerId !== gameData.picker) 
            if(!gameData.word) {
                setGuess('')
                return 'waitOnWord'
            }
            else if (finishedGuessing) return 'guessed'
            else return 'guessing'

        return 'guessing'
    }, [finishedGuessing, gameData, playerId])


    useEffect(() => {
        async function f() {
            if(!listener)
                listenForGameUpdates((data, l) => {
                    setGameData(data)

                    if(data.players[playerId].timeStamp) setFinishedGuessing(true)

                    if(data.picker === playerId) {
                        let winners = 0
                        data.players.forEach(p => {
                            if(p.timeStamp) winners++
                        })

                        if(winners === data.players.length - 1) {
                            startNextRound()
                        }
                    }

                    if(!listener) setListener(l)
                })
        }

        f()
    }, [])

    useEffect(() => {
        if(wordError === 'error') {
            messageApi.open(
                {
                    type: 'error',
                    content: getFailedWordMessage()
                }
            )
        }
        else if (wordError === 'repeat') messageApi.info('Already guessed that')
        setWordError(false)
    }, [messageApi, wordError])

    const barColor = useMemo(() => {
        if (progress > 50 ) 
            return '#177ddc' 

        if (progress > 30) 
            return '#fff44fbb' 

        return '#ff0000bb'
    }, [progress])

    useEffect(() => {
        if(!tick) 
            setTimeout(() => setTick(true), 1000)
        
        else {
            if(view === 'guessing' || view === 'waitingOnGuess') {
                const startDate = new Date(gameData.startTime)
                const NOW = new Date()
                const timeDiff = (NOW - startDate) / 1000
                const progressToSet = ((180 - timeDiff) / 180) * 100

                if(progress > 0) setProgress(progressToSet)
                else if(view === 'waitingOnGuess') {
                    startNextRound()
                }
            }

            setTick(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    const sortedGuesses = useMemo(() => {
        const locallyStoredList = getFromLocalStorage('wf-previousGuesses')

        if(view === 'waitOnWord') {
            removeFromLocalStorage('wf-previousGuesses')
            setFinishedGuessing(false)
            return []
        }

        if(!guessList && !locallyStoredList) return []
        if(locallyStoredList && !guessList) setGuessList(locallyStoredList)

        let copy = locallyStoredList ? [...locallyStoredList] : []
        const listToSort = (!guessList && copy) ? [...guessList] : [...copy]
        
        if(gameData?.word) listToSort.push(gameData.word)

        const sorted = listToSort.sort((a, b) => {
            if(a.toLocaleLowerCase() > b.toLocaleLowerCase()) return 1 
            else if(a.toLocaleLowerCase() < b.toLocaleLowerCase()) return -1
            return 0
        })

        if(gameData && sorted) sorted[sorted.indexOf(gameData.word)] = createHiddenWord(gameData.word)

        return sorted
    }, [gameData, guessList, view])

    const sortedPlayers = useMemo(() => {
        if(!gameData) return []
        const sorted = gameData.players.sort((a,b) => {
            if(a?.points > b?.points) return -1

            if(a?.name > b?.name) return -1

            return 1
        })

        return sorted
    }, [gameData])

    function getFailedWordMessage() {
        const picks = [
            "Yeah, that's not a word",
            'Try again there friend',
            'Nope, not a word',
            "That's not really a word...",
            'No, an ENGLISH word',
            'Check your spelling',
            'Not quite a word there pal',
            'That thing you typed? Not a word',
            'Survey says... not a word',
            "I'm sure your finger just slipped"
        ]

        return picks[Math.floor(Math.random() * picks.length)]
    }

    async function addGuess() {

        const isWord = await checkStringForRealWord(guess)

        if(!isWord) setWordError('error')

        else if(guessList?.find(g => g.toLowerCase() === guess.toLowerCase())) setWordError('repeat')
        
        else if(guess.toLowerCase() !== gameData.word.toLowerCase()) { 
            const arr = [...guessList]
            arr.push(guess)
            setGuess('')

            writeToLocalStorage('wf-previousGuesses', arr)
            setGuessList(arr)
        }

        else if(guess.toLowerCase() === gameData.word.toLowerCase()) {
            markWordGuessed(new Date().toISOString())
            setFinishedGuessing(true)
            setGuess('')
        }
    }

    async function setMyWord() {
        const resp = await setWord(guess)
        if(!resp) messageApi.info('There was an error setting your word. Double check the spelling, just in case.')
        else setGuess('')
    }

    function goHome() {
        cleanStoredData()
        removeListener(listener)
        navigate('/')
    }

    return(
        <div className="route-container" id="word-fight-container">
            {contextHolder}
            {view === 'picker' && (
                <div className='main-container'>
                    <span style={{paddingBottom: '4px'}} >Pick a word to try and trick everyone</span>
                    <Input.Group compact>
                        <Input value={guess} onChange={e => setGuess(e.target.value)} style={{ width: 'calc(100% - 76px)'}}  />
                        <Button type='primary' onClick={setMyWord} >Submit</Button>
                    </Input.Group>
                </div>
            )}
            {
                view === 'waitOnWord' && (
                    <div className='main-container' style={{alignItems: 'center'}} >
                        <div style={{width: '100%'}} >Waiting on {gameData?.players[gameData.picker]?.name ?? gameData.players[0].name} to pick a word</div>
                        <br />
                        <h2 style={{width: '100%', borderBottom: '1px solid white'}} >Score board</h2>
                        <div id="score-board">
                            {sortedPlayers.map((p) => (
                                    <div className='score-board-row' key={p.name}>
                                        <div>{p.name}</div> 
                                        <div>{p.points ?? 0}</div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )
            }
            {
                view === 'guessing' && (
                    <div className='main-container' style={{justifyContent: 'flex-start'}}>
                        <div id='fade-wrapper'>
                            <div id="top-fade" className='fader'></div>
                            <div id='previous-guesses'>
                                {sortedGuesses.map((g, itr) => {
                                    if(g[0] === '?') return <h4 key={`${itr}-guess`} className='guess-in-list bright-white'>{g}</h4>

                                    return <h4 key={`${itr}-guess`} className='guess-in-list'>{g}</h4>
                                })}
                            </div>
                            <div id="bottom-fade" className='fader'></div>
                        </div>

                        <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} trailColor="#434343" />

                        <Input.Group compact>
                            <Input value={guess} onChange={e => setGuess(e.target.value)} style={{ width: 'calc(100% - 66px)'}} allowClear  />
                            <Button type='primary' onClick={addGuess} >Guess</Button>
                        </Input.Group>
                    </div>
                )
            }
            {
                view === 'waitingOnGuess' && (
                    <div className='main-container waiting-screen'>
                        <Progress percent={progress} showInfo={false} strokeLinecap="square" strokeColor={barColor} trailColor="#434343" />
                        <h2 style={{width: '100%', borderBottom: '1px solid #ffffff', marginBottom: '4px'}}>Waiting on guesses</h2>
                        {gameData.players.map((p, itr) => {
                            if(itr === gameData.picker || (itr === 0 && !gameData.picker)) return null
                            return (
                            <div className='player-and-check' style={{backgroundColor: itr % 2 === 1 ? '#232323': 'transparent' }} >
                                <div>{p.name}</div>
                               {p.timeStamp && <div style={{color: 'green', paddingLeft: '8px'}} ><CheckOutlined /></div>}
                            </div>)
                        })}
                    </div>
                )
            }
            {
                view === 'guessed' && (
                    <div className='main-container guessed-screen'>
                        <div className='guess-finished'>
                            <h3>Great work! The word was</h3>
                            <h3 style={{color: 'var(--primary)', paddingLeft: '4px'}} >{gameData.word}</h3>
                        </div>
                        <br />
                        <br />
                        <div style={{width: '100%', borderBottom: '1px solid #ffffff', marginBottom: '4px'}} >Other players:</div>
                        {gameData.players.map((p, itr) => {
                            if(itr === gameData.picker || playerId === itr || (itr === 0 && !gameData.picker)) return null
                            return (
                            <div className='player-and-check' style={{backgroundColor: itr % 2 === 1 ? '#232323': 'transparent' }} >
                                <div>{p.name}</div>
                               {p.timeStamp && <div style={{color: 'green', paddingLeft: '8px'}} ><CheckOutlined /></div>}
                            </div>)
                        })}
                    </div>
                )
            }
            {
                view === 'ended' && (
                    <div className='main-container' style={{alignItems: 'center'}}>
                        <h1>Game Over</h1>
                        <div>Congrats to {sortedPlayers[0].name}!</div>
                        <br />
                        <div id="score-board" style={{width: '300px'}} >
                            {sortedPlayers.map((p) => (
                                    <div className='score-board-row' key={p.name}>
                                        <div>{p.name}</div> 
                                        <div>{p.points ?? 0}</div>
                                    </div>
                                )
                            )}
                        </div>

                        <br />
                        <br />  
                        <Button type='primary' onClick={goHome} >Return To Home</Button>
                    </div>
                )
            }
        </div>
    )
}