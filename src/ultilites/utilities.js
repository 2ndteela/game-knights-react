export const getGameStates = gameType => {
    const baseStates = {
        lobby: 'lobby',
        started: 'started',
        ended: 'ended'
    }

    if(gameType === 'ai') {
        baseStates.writingAnswer = 'answer'
        baseStates.writingQuestions = 'questions'
        baseStates.picking = 'picking'
        baseStates.results = 'results'
    }

    else if(gameType === 'wf') {
        baseStates.writingWords = 'writing'
        baseStates.guessing = 'guessing'
        baseStates.results = 'results'
    }

    return baseStates
}

export const writeToLocalStorage = (path, data) => {
    localStorage[path] = JSON.stringify(data)
}

export const writeNewGameData = (code, playerId) => {
    writeToLocalStorage('gameCode', code)
    writeToLocalStorage('playerId', playerId)
}

export const getFromLocalStorage = path => {
    try {
        return JSON.parse(localStorage[path])
    }
    catch (err) {
        return null
    }
}

export const removeFromLocalStorage = path => {
    localStorage.removeItem(path)
}

export const getStoredGameData = () => {
    return {
        gameCode: getFromLocalStorage('gameCode'),
        playerId: getFromLocalStorage('playerId')
    }
}

export const cleanStoredData = () => {
    removeFromLocalStorage('gameCode')
    removeFromLocalStorage('playerId')
}

export const generateCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''

    for(let i = 0; i < 6; i++)
        code += letters[Math.floor(Math.random() * 26)]

    return code
}