import { getDatabase, ref, child, get, set, onValue, off } from "firebase/database";
import { generateCode, getStoredGameData } from "./utilities";

const dbReadOnce = async path => {
    try {
        const db = ref(getDatabase())
        const promise = await get(child(db, path))
        if(promise.exists()) 
            return promise.val()

        return false
    }
    catch (err) {
        throw err
    }
}

const writeToDb = async (path, value) => {
    try {
        const db = getDatabase()
        set(ref(db, path,), value)
    }
    catch (error) {
        throw error
    }
}

const listenToDb = async (path, callBack) => {
    try {
        const db = getDatabase()
        const listeningValue = ref(db, path)

        onValue(listeningValue, (snapShot) => {
            const data = snapShot.val()
            callBack(data, listeningValue)
        })
    }
    catch(error) {
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
    catch(err) {
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
    catch(error) {
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
            if(NOW - gameStarted > ONE_WEEK)
                writeToDb(`/games/${k}`, null)
        })

        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}

// He Said She Said functions
export const removeMeFromLobby = () => {
    const { gameCode, playerId} = getStoredGameData()
    
    writeToDb(`games/${gameCode}/players/${playerId}`, null)
}

export const getNewGameCode = async () => {
    let code = null
    let good = true
    try {
        while(good) {
            code = generateCode()
            good = await dbReadOnce(`games/${code}`)
        }
        return code  
    }
    catch(error) {
        console.error(error)  
    }
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

    if(game === 'ai') {
        gameData.picker = 0

        if(!pointsToWin) return

        gameData.pointsToWin = pointsToWin
    }

    writeToDb(`games/${code}`, gameData)
    cleanOldData()
}

export const startGame = async (starter) => {
    const { gameCode } = getStoredGameData()
    writeToDb(`games/${gameCode}/state`, 'started')
    if(starter)
        writeToDb(`games/${gameCode}/picker`, starter)
}

export const joinLobby = async (code, player) => {
    try {
        const data = await dbReadOnce(`games/${code}`)
        if(data) {
            const playerCount = Object.keys(data.players).length
            writeToDb(`games/${code}/players/${playerCount}/name`, player)

            return playerCount
        }
        else return -1
    }
    catch(error) {
        console.error(error)
    }
}

export const saveHsssResponse = async (response, step) => {
    try {
        const {playerId, gameCode} = getStoredGameData()
        await writeToDb(`games/${gameCode}/players/${playerId}/responses/${step}`, response)
        return true
    }
    catch (err) {
        return false
    }
}

export const checkForEndOfHsssGame = async () => {
    try {
        const {gameCode} = getStoredGameData()
        const data = await dbReadOnce(`games/${gameCode}/players`)
        let allDone = true
        data.forEach(player => {
            if(player.responses.length < 10)
                allDone = false
        })

        return allDone
    }
    catch(error) {
        console.error(error)
        return false
    }
}

export const getHsssGameData = async () => {
    try {
        const {gameCode} = getStoredGameData()
        const data = await dbReadOnce(`games/${gameCode}`)
        return data
    }
    catch(error) {
        console.error(error)
        return null
    }

}

// Answer Is functions
export const setAnswerForRound = async answer => {
    try {
        const {gameCode} = getStoredGameData()
        await writeToDb(`games/${gameCode}/answer`, answer)
        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}

export const setQuestionForUser = async question => {
    try {
        const {gameCode, playerId} = getStoredGameData()
        writeToDb(`games/${gameCode}/players/${playerId}/question`, question ? question : '--')
    }
    catch(error) {
        console.error(error)
        return false
    }
}

export const awardPoint = async (playerId) => {
    try {
        const {gameCode} = getStoredGameData()
        const points = await dbReadOnce(`games/${gameCode}/players/${playerId}/points`)
        console.log(points)
        await writeToDb(`games/${gameCode}/players/${playerId}/points`, points ? points + 1 : 1)
        await writeToDb(`games/${gameCode}/recentWinner`, playerId)
        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}

export const advanceToNextRound = async () => {
    try {
        const {gameCode} = getStoredGameData()
        const gameData = await dbReadOnce(`/games/${gameCode}`)
        const copy = {...gameData}
        const nextPicker = gameData.picker === gameData.players.length - 1 ? 0 : gameData.picker + 1
        
        copy.players.forEach( p => delete p.question)
        copy.picker = nextPicker
        delete copy.votes

        await writeToDb(`games/${gameCode}`, copy)
        await setGameState('answer')

        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}

export const voteToContinue = async () => {
    try {
        const {gameCode} = getStoredGameData()
        const gameData = await dbReadOnce(`/games/${gameCode}`)

        if(gameData?.votes + 1 > (gameData.players.length / 2)) {
            advanceToNextRound()
        }

        else 
            writeToDb(`games/${gameCode}/votes`, gameData.votes ? gameData.votes + 1 : 1)

        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}


// Word Fight functions
export const setWord = async (word) => {
    try {
        const {gameData} = getStoredGameData()
        writeToDb(`/games/${gameData}/word`)
        return true
    }
    catch(error) {
        console.error(error)
        return false
    }
}