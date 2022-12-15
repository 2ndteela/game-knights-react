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
    removeFromLocalStorage('hsssStep')
    removeFromLocalStorage('ai-voted')
}

export const generateCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''

    for(let i = 0; i < 6; i++)
        code += letters[Math.floor(Math.random() * 26)]

    return code
}

export const whoAmIWaitingOn = (gameData) => {
    try {
        const playersStillPlaying = []
        if(gameData.game === 'ai') {

            gameData.players.forEach((p, itr) => {
                if(!p.question && itr !== parseInt(gameData.picker)) 
                    playersStillPlaying.push(p.name)
            })
        }

        return playersStillPlaying
    }
    catch(error) {
        console.error(error)
        return []
    }
}

export const makeRandomAIAnswer = () => {
    const answers = [
        '69 ;)',
        '420',
        'Your mom',
        'Perry the Platypus',
        'The great pyramids',
        'England',
        'The Queen (RIP)',
        'Adam and Eve',
        'The Office',
        'Micheal Scott',
        'Mike Tyson',
        'Tom Cruise',
        'Your Boss',
        'It is what it is',
        'Yes',
        'No',
        'Coffee',
        'Santa',
        'The Dahla Lama',
        'Cbat',
        'Fire',
        'Champagne',
        'Kiss the person to my left',
        'Dance',
        'Stripping',
        'Boxes',
        'Dreams',
        'The Lord of the Rings',
        'Captain Falcon',
        'The Beatles',
        'Charizard',
        'Sushi'
    ]

    return answers[Math.floor(Math.random() * answers.length)]
}

export const createHiddenWord = (word) => {
    if(!word) return '????????'
    const arr = []
    for(let i = 0; i < word.length; i++) 
        arr.push('?')

    return arr.join('')
}