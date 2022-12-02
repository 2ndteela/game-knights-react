import { Input, Button, message } from 'antd'
import {useState, useMemo, useEffect} from 'react'
import { checkStringForRealWord, listenForGameUpdates, markWordGuessed, setWord } from '../../../ultilites/services'
import { createHiddenWord, getFromLocalStorage, getStoredGameData, writeToLocalStorage } from '../../../ultilites/utilities'
import './WordFightStyles.less'

export default function WordFightMain() {
    const [messageApi, contextHolder] = message.useMessage();
    const {playerId} = getStoredGameData()
    const initialList = getFromLocalStorage('ai-previousGuesses')

    const [ guess, setGuess ] = useState()
    const [ gameData, setGameData ] = useState()
    const [ guessList, setGuessList ] = useState(initialList ? initialList : [])
    const [ listener, setListener ] = useState()
    const [ wordError, setWordError ] = useState(false)

    const view = useMemo(() => {
        if(!gameData) return 'fetching'
        if(playerId === gameData.picker || (!gameData.picker && playerId === 0  )) 
            if(!gameData.word) return 'picker'
            else return 'waitingOnGuess'
        if(playerId !== gameData.picker) 
            if(!gameData.word) return 'waitOnWord'
            else return 'guessing'

        return 'guessing'
    }, [gameData, playerId])


    useEffect(() => {
        async function f() {
            if(!listener)
                listenForGameUpdates((data, l) => {
                    console.log(data)
                    setGameData(data)

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

    const sortedGuesses = useMemo(() => {
        const locallyStoredList = getFromLocalStorage('ai-previousGuesses')
        if(!guessList && !locallyStoredList) return []
        if(locallyStoredList && !guessList) setGuessList(locallyStoredList)

        let copy = locallyStoredList ? [...locallyStoredList] : []
        const listToSort = (!guessList && copy) ? [...guessList] : [...copy]
        
        if(gameData) listToSort.push(gameData.word)


        const sorted = listToSort.sort((a, b) => {
            if(a.toLocaleLowerCase() > b.toLocaleLowerCase()) return 1 
            else if(a.toLocaleLowerCase() < b.toLocaleLowerCase()) return -1
            return 0
        })

        if(gameData) sorted[sorted.indexOf(gameData.word)] = createHiddenWord(gameData.word)

        return sorted
    }, [gameData, guessList])

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

        else if(guessList.find(g => g.toLowerCase() === guess.toLowerCase())) setWordError('repeat')
        
        else if(guess !== gameData.word){ 
            const arr = [...guessList]
            arr.push(guess)
            setGuess('')

            writeToLocalStorage('ai-previousGuesses', arr)
            setGuessList(arr)
        }

        else if(guess === gameData.word) {
            let guessed = 0
            
            gameData.players.forEach(player => {if(player.guessed) guessed += 1})
            markWordGuessed(guessed)
        }
    }

    function setMyWord() {
        setWord(guess)
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
                    <>
                        <h1>Waiting on word to be selected</h1>
                    </>
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
                        <Input.Group compact>
                            <Input value={guess} onChange={e => setGuess(e.target.value)} style={{ width: 'calc(100% - 66px)'}} allowClear  />
                            <Button type='primary' onClick={addGuess} >Guess</Button>
                        </Input.Group>
                    </div>
                )
            }
            {
                view === 'waitingOnGuess' && (
                    <div className='main-container'>
                        <>
                            <h1>Waiting on guesses</h1>
                        </>
                    </div>
                )
            }
        </div>
    )
}