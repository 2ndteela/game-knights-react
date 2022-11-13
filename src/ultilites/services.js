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

export const setGameFinished = async () => {
    const { gameCode } = getStoredGameData()
    writeToDb(`games/${gameCode}/state`, 'ended')
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

export const openLobby = async (code, game, screenName) => {

    const gameData = {
        state: 'lobby',
        game,
        players: [
            {
                name: screenName,
            }
        ]
    }

    if(game === 'ai') gameData.picker = 0

    writeToDb(`games/${code}`, gameData)
}

export const startGame = async () => {
    const { gameCode } = getStoredGameData()
    writeToDb(`games/${gameCode}/state`, 'started')
}

export const joinLobby = async (code, player) => {
    try {
        const data = await dbReadOnce(`games/${code}`)
        if(data) {
            const playerCount = Object.keys(data.players).length
            writeToDb(`games/${code}/players/${playerCount}/name`, player)

            if(data.game === 'ai') writeToDb(`games/${code}/order`, data.order + `-${player}`)

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

// Word Fight functions
