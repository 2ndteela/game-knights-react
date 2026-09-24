import { message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { checkStringForRealWord, listenForGameUpdates, markWordGuessed, setWord, startNextRound } from '../../../utilities/services'
import { createHiddenWord, getFromLocalStorage, getStoredGameData, removeFromLocalStorage, writeToLocalStorage } from '../../../utilities/utilities'
import { useGoHome } from '../../../hooks/useGoHome'

const ROUND_SECONDS = 180

const failedWordMessages = [
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

const pickFailedWordMessage = () =>
    failedWordMessages[Math.floor(Math.random() * failedWordMessages.length)]

// Whoever gameData.picker points at, falling back to the first player: a lobby
// opens without an explicit picker until the host starts the game.
const isPicker = (idx, picker) => idx === picker || (!picker && idx === 0)

// Owns everything the Word Fight round needs: the database subscription, the
// round timer, the guess list and the actions. The screens under ./components
// take what they render as props, so this is the only place holding state.
export function useWordFightGame() {
    const [messageApi, contextHolder] = message.useMessage()
    const { playerId } = getStoredGameData()
    const initialList = getFromLocalStorage('wf-previousGuesses')

    const [guess, setGuess] = useState()
    const [gameData, setGameData] = useState()
    const [guessList, setGuessList] = useState(initialList ? initialList : [])
    const [listener, setListener] = useState()
    const [wordError, setWordError] = useState(false)
    const [finishedGuessing, setFinishedGuessing] = useState(false)
    const [progress, setProgress] = useState(100)
    const [tick, setTick] = useState(false)

    const goHome = useGoHome(listener)

    const view = useMemo(() => {
        if (!gameData) return 'fetching'
        if (gameData.state === 'ended') return 'ended'

        if (isPicker(playerId, gameData.picker))
            return gameData.word ? 'waitingOnGuess' : 'picker'

        if (!gameData.word) return 'waitOnWord'
        return finishedGuessing ? 'guessed' : 'guessing'
    }, [finishedGuessing, gameData, playerId])

    useEffect(() => {
        async function f() {
            if (!listener)
                listenForGameUpdates((data, l) => {
                    setGameData(data)

                    if (data.players?.[playerId]?.timeStamp) setFinishedGuessing(true)

                    if (data.picker === playerId) {
                        let winners = 0
                        data.players.forEach(p => {
                            if (p.timeStamp) winners++
                        })

                        if (winners === data.players.length - 1) {
                            startNextRound()
                        }
                    }

                    if (!listener) setListener(l)
                })
        }

        f()
    }, [])

    useEffect(() => {
        if (wordError === 'error') {
            messageApi.open(
                {
                    type: 'error',
                    content: pickFailedWordMessage()
                }
            )
        }
        else if (wordError === 'repeat') messageApi.info('Already guessed that')
        setWordError(false)
    }, [messageApi, wordError])

    useEffect(() => {
        if (!tick) {
            const timer = setTimeout(() => setTick(true), 1000)
            return () => clearTimeout(timer)
        }

        if (view === 'guessing' || view === 'waitingOnGuess') {
            const startDate = new Date(gameData.startTime)
            const NOW = new Date()
            const timeDiff = (NOW - startDate) / 1000
            const progressToSet = ((ROUND_SECONDS - timeDiff) / ROUND_SECONDS) * 100

            if (progress > 0) setProgress(progressToSet)
            else if (view === 'waitingOnGuess') {
                startNextRound()
            }
        }

        setTick(false)
        return undefined
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    // Clear last round's guesses once the next picker is choosing a word.
    useEffect(() => {
        if (view !== 'waitOnWord') return

        removeFromLocalStorage('wf-previousGuesses')
        setGuessList([])
        setFinishedGuessing(false)
        setGuess('')
    }, [view])

    const sortedGuesses = useMemo(() => {
        if (view === 'waitOnWord') return []

        // guessList is the source of truth: it is seeded from localStorage on
        // mount and kept in step with it by addGuess.
        const listToSort = [...guessList]
        if (gameData?.word) listToSort.push(gameData.word)

        const sorted = listToSort.sort((a, b) =>
            a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))

        // Show the target word's alphabetical position without revealing it.
        if (gameData?.word) {
            const wordIdx = sorted.indexOf(gameData.word)
            if (wordIdx > -1) sorted[wordIdx] = createHiddenWord(gameData.word)
        }

        return sorted
    }, [gameData, guessList, view])

    // Highest score first, then alphabetically. Sorts a copy and keeps each
    // player's original position as `idx`, because the database stores players
    // by that position and the round views compare it against gameData.picker.
    const sortedPlayers = useMemo(() => {
        if (!gameData?.players) return []

        return gameData.players
            .map((p, idx) => ({ ...p, idx }))
            .sort((a, b) =>
                (b.points ?? 0) - (a.points ?? 0) || a.name.localeCompare(b.name))
    }, [gameData])

    // Everyone guessing this round, in lobby order and carrying their original
    // index, which is what the rows are banded by.
    const guessers = useMemo(() => {
        if (!gameData?.players) return []

        return gameData.players
            .map((p, idx) => ({ ...p, idx }))
            .filter(p => !isPicker(p.idx, gameData.picker))
    }, [gameData])

    const otherGuessers = useMemo(
        () => guessers.filter(p => p.idx !== playerId),
        [guessers, playerId]
    )

    const pickerName = useMemo(() => {
        if (!gameData?.players) return ''

        return gameData.players[gameData.picker]?.name ?? gameData.players[0].name
    }, [gameData])

    async function addGuess() {

        const isWord = await checkStringForRealWord(guess)

        if (!isWord) setWordError('error')

        else if (guessList?.find(g => g.toLowerCase() === guess.toLowerCase())) setWordError('repeat')

        else if (guess.toLowerCase() !== gameData.word.toLowerCase()) {
            const arr = [...guessList]
            arr.push(guess)
            setGuess('')

            writeToLocalStorage('wf-previousGuesses', arr)
            setGuessList(arr)
        }

        else if (guess.toLowerCase() === gameData.word.toLowerCase()) {
            markWordGuessed(new Date().toISOString())
            setFinishedGuessing(true)
            setGuess('')
        }
    }

    async function setMyWord() {
        const resp = await setWord(guess)
        if (!resp) messageApi.info('There was an error setting your word. Double check the spelling, just in case.')
        else setGuess('')
    }

    return {
        view,
        guess,
        setGuess,
        progress,
        word: gameData?.word,
        pickerName,
        sortedGuesses,
        sortedPlayers,
        guessers,
        otherGuessers,
        addGuess,
        setMyWord,
        goHome,
        contextHolder
    }
}
