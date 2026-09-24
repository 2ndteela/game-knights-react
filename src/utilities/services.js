import { ref, child, get, set, onValue, off } from "firebase/database";
import { getGenerativeModel, Schema } from "firebase/ai";
import { ai, database } from "./firebase";
import { getStoredGameData } from "./utilities";

const dbReadOnce = async path => {
    const db = ref(database)
    const promise = await get(child(db, path))
    if (promise.exists())
        return promise.val()

    return false
}

const writeToDb = async (path, value) => {
    set(ref(database, path), value)
}

const listenToDb = async (path, callBack) => {
    try {
        const listeningValue = ref(database, path)

        onValue(listeningValue, (snapShot) => {
            const data = snapShot.val()
            callBack(data, listeningValue)
        })
    }
    catch (error) {
        console.error(error)
    }
}

export const removeListener = async (listener) => {
    off(listener)
}

export const getGameData = async gameCode => {
    try {
        const data = await dbReadOnce(`games/${gameCode}`)
        return data
    }
    catch (err) {
        console.error(err)
        return false
    }
}

export const removeGameFromDb = (gameCode) => {
    try {
        writeToDb(`games/${gameCode}`, null)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const listenForGameUpdates = async (callBack) => {
    const { gameCode } = getStoredGameData()
    return listenToDb(`games/${gameCode}`, callBack)
}

export const listenForGameState = async (callBack) => {
    const { gameCode } = getStoredGameData()
    return listenToDb(`games/${gameCode}/state`, callBack)
}


export const setGameState = async newState => {
    try {
        const { gameCode } = getStoredGameData()
        writeToDb(`games/${gameCode}/state`, newState)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const setGameFinished = async () => {
    const { gameCode } = getStoredGameData()
    writeToDb(`games/${gameCode}/state`, 'ended')
}

const cleanOldData = async () => {
    try {
        const games = await dbReadOnce('/games')
        const keys = Object.keys(games)
        const NOW = new Date()
        const ONE_WEEK = 6.048e+8

        keys.forEach(k => {
            const g = games[k]
            const gameStarted = new Date(g.started)
            if (NOW - gameStarted > ONE_WEEK || !g.started)
                writeToDb(`/games/${k}`, null)
        })

        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

// He Said She Said functions
export const removeMeFromLobby = () => {
    const { gameCode, playerId } = getStoredGameData()

    writeToDb(`games/${gameCode}/players/${playerId}`, null)
}

export const openLobby = async (code, game, screenName, pointsToWin) => {

    const gameData = {
        state: 'lobby',
        game,
        started: new Date().toISOString().substring(0, 10),
        players: [
            {
                name: screenName,
            }
        ]
    }

    if (game === 'ai') {
        gameData.picker = 0

        if (!pointsToWin) return

        // Stored as a number so the win check can compare it against points.
        gameData.pointsToWin = Number(pointsToWin)
        gameData.players[0].id = 0
    }

    writeToDb(`games/${code}`, gameData)
    cleanOldData()
}

export const startGame = async (starter) => {
    const { gameCode } = getStoredGameData()
    writeToDb(`games/${gameCode}/state`, 'started')
    if (starter)
        writeToDb(`games/${gameCode}/picker`, starter)
}

export const joinLobby = async (code, player, game) => {
    try {
        const data = await dbReadOnce(`games/${code}`)
        if (data) {

            if (data.game !== game) return -2

            else {
                const playerCount = Object.keys(data.players).length
                writeToDb(`games/${code}/players/${playerCount}`, { name: player, id: playerCount })
                return playerCount
            }
        }
        else return -1
    }
    catch (error) {
        console.error(error)
        return -1
    }
}

export const saveHsssResponse = async (response, step) => {
    try {
        const { playerId, gameCode } = getStoredGameData()
        await writeToDb(`games/${gameCode}/players/${playerId}/responses/${step}`, response)
        return true
    }
    catch (err) {
        return false
    }
}

// A host can replace the standard prompts with their own, so the number of
// answers that counts as "finished" comes from the game the players are in
// rather than from a constant.
export const checkForEndOfHsssGame = async (promptCount) => {
    try {
        const { gameCode } = getStoredGameData()
        const data = await dbReadOnce(`games/${gameCode}/players`)
        let allDone = true
        data.forEach(player => {
            if (!player.responses || player.responses.length < promptCount)
                allDone = false
        })

        return allDone
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const getHsssGameData = async (queryCode = null) => {
    try {
        const gameCode = queryCode ? queryCode : getStoredGameData()?.gameCode
        const data = await dbReadOnce(`games/${gameCode}`)
        return data
    }
    catch (error) {
        console.error(error)
        return null
    }
}

// Custom prompts are stored as a plain array of strings on the game itself, so
// every player picks them up with the rest of the game data and the standard
// story costs nothing to store: no prompts written means the defaults.
export const setHsssPrompts = async (code, prompts) => {
    try {
        await writeToDb(`games/${code}/prompts`, prompts)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const getHsssPrompts = async (queryCode = null) => {
    try {
        const gameCode = queryCode ? queryCode : getStoredGameData()?.gameCode
        if (!gameCode) return false

        return await dbReadOnce(`games/${gameCode}/prompts`)
    }
    catch (error) {
        console.error(error)
        return false
    }
}

// Asking for JSON in the prompt alone gets prose or fenced code often enough to
// matter, so the shape is declared instead and the model is held to it.
const promptListSchema = Schema.array({
    items: Schema.string({ description: 'A single short prompt for one player to answer' })
})

// Built on first use rather than at import time: most sessions never open the
// story creator, and nothing else should pay for setting the model up.
let storyModel = null

const getStoryModel = () => {
    if (!storyModel)
        storyModel = getGenerativeModel(ai, {
            // Free tier on the Gemini Developer API backend. Swap to
            // 'gemini-3.5-flash-lite' if this ever needs to be cheaper --
            // ten short prompts is not demanding work.
            model: 'gemini-3.8-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: promptListSchema,
                // Suggestions that come back identical every time are no help.
                temperature: 1.3
            }
        })

    return storyModel
}

// Returns a list of suggested prompts, or false if the model gave back anything
// unusable -- the create screen says so rather than wiping the host's fields.
export const getHelpCreatingStory = async (examples) => {
    const prompt = `My friends are playing a simulated version of a write and pass game that functions as a collaborative mad lib.
    We need ${examples.length} simple prompts to help build out the scene and you need to generate them. These are the baseline prompts:
${examples.map((e, i) => `    ${i + 1}). ${e}`).join('\n')}
    Your prompts should follow a loosely similar format but don't need to be exactly the same. Each one is answered by a different
    person who cannot see the others, so they have to stand alone. They are only suggestions for the user to approve so make them as
    whacky as you want. Keep each one under 60 characters.`

    try {
        const result = await getStoryModel().generateContent(prompt)
        const suggestions = JSON.parse(result.response.text())

        if (!Array.isArray(suggestions)) return false

        const usable = suggestions
            .filter(s => typeof s === 'string' && s.trim())
            .map(s => s.trim().substring(0, 60))
            .slice(0, examples.length)

        return usable.length ? usable : false
    }
    catch (error) {
        console.error(error)
        return false
    }
}

// Answer Is functions
export const setAnswerForRound = async answer => {
    try {
        const { gameCode } = getStoredGameData()
        await writeToDb(`games/${gameCode}/answer`, answer)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const setQuestionForUser = async question => {
    try {
        const { gameCode, playerId } = getStoredGameData()
        writeToDb(`games/${gameCode}/players/${playerId}/question`, question ? question : '--')
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const awardPoint = async (playerId) => {
    try {
        const { gameCode } = getStoredGameData()
        const points = await dbReadOnce(`games/${gameCode}/players/${playerId}/points`)
        await writeToDb(`games/${gameCode}/players/${playerId}/points`, points ? points + 1 : 1)
        await writeToDb(`games/${gameCode}/recentWinner`, playerId)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const advanceToNextRound = async () => {
    try {
        const { gameCode } = getStoredGameData()
        const gameData = await dbReadOnce(`/games/${gameCode}`)
        const copy = { ...gameData }
        const nextPicker = gameData.picker === gameData.players.length - 1 ? 0 : gameData.picker + 1

        copy.players.forEach(p => delete p.question)
        copy.picker = nextPicker
        delete copy.votes

        await writeToDb(`games/${gameCode}`, copy)
        await setGameState('answer')

        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const voteToContinue = async () => {
    try {
        const { gameCode } = getStoredGameData()
        const gameData = await dbReadOnce(`/games/${gameCode}`)

        if (gameData?.votes + 1 > (gameData.players.length / 2)) {
            advanceToNextRound()
        }

        else
            writeToDb(`games/${gameCode}/votes`, gameData.votes ? gameData.votes + 1 : 1)

        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}


// Word Fight functions
export const setWord = async (word) => {
    try {
        const { gameCode } = getStoredGameData()
        const wordCheck = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        const wordData = await wordCheck.json()
        if (!wordData?.length) return false

        await writeToDb(`/games/${gameCode}/word`, word)
        await writeToDb(`/games/${gameCode}/startTime`, new Date().toISOString())
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const checkStringForRealWord = async (word) => {
    try {
        const wordCheck = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        const wordData = await wordCheck.json()
        if (!wordData?.length) return false
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}


export const markWordGuessed = async (timeStamp) => {
    try {
        const { gameCode, playerId } = getStoredGameData()
        await writeToDb(`/games/${gameCode}/players/${playerId}/timeStamp`, timeStamp)
        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}

export const startNextRound = async () => {
    try {
        const { gameCode } = getStoredGameData()
        const gameData = await dbReadOnce(`/games/${gameCode}`)
        const copy = { ...gameData }

        if (!copy.picker) copy.picker = 0

        copy.picker += 1
        delete copy.word
        delete copy.startTime

        copy.players.forEach(p => {

            let pointsToAward = 0

            if (p.timeStamp) {
                const startDate = new Date(gameData.startTime)
                const roundComplete = new Date(p.timeStamp)
                const timeDiff = (roundComplete - startDate) / 1000

                if (timeDiff < 300) pointsToAward = Math.ceil(300 - timeDiff)

                if (!p.points) p.points = pointsToAward
                else p.points += pointsToAward

                delete p.timeStamp
            }
        })

        if (!gameData.rounds) copy.rounds = 1
        else copy.rounds = copy.rounds += 1

        if (copy.picker > copy.players.length - 1) copy.picker = 0

        if (copy.rounds > copy.players.length - 1) copy.state = 'ended'

        writeToDb(`games/${gameCode}`, copy)

        return true
    }
    catch (error) {
        console.error(error)
        return false
    }
}