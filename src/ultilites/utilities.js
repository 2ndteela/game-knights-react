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
    removeFromLocalStorage('wf-previousGuesses')
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

export const getHSSSTutorial = () => {
    const one = require('../assets/photos/hsss-1.png')
    const two = require('../assets/photos/hsss-2.png')


    return {
        title: 'He Said She Said',
        steps: [
            {
                text: "He Said She Said is a game without a winner. Think of it as a story you are writing with your friends, but no one knows what anyone else has written"
            },
            {
                img: one,
                text: "You're going to get some prompts, just answer them whatever way you feel is best. Celebrities, people in the room, catch phrases and just about anything you can think of are all free game."
            },
            {
                img: two,
                text: "After everyone has finished their prompts (there are 10 of them), the game will mix up everyone's responses and spit out some fun stories for you all to share."
            }
        ]
    }
}

export const getAITutorial = () => {
    const one = require('../assets/photos/ai-1.png')
    const two = require('../assets/photos/ai-2.png')
    const three = require('../assets/photos/ai-3.png')
    const four = require('../assets/photos/ai-4.png')

    return {
        title: 'Answer Is',
        steps: [
            {
                img: one,
                text: "Answer Is is all about twisting your friends words against them. First, one person will give a random answer. It can be a number, a word, a whole sentence or anything really."
            },
            {
                img: two,
                text: 'From there, everyone else will get the chance to give a question for that answer.'
            }, 
            {
                img: three,
                text: 'The Answer writer then votes on their favorite question and that person wins the round. From there, a new person will be picked to provide the answer.'
            },
            {
                img: four,
                text: 'The first person to reach the set score, wins!'
            }
        ]
    }
}

export const getWFTutorial = () => {
    const one = require('../assets/photos/wf-1.png')
    const two = require('../assets/photos/wf-2.png')
    const three = require('../assets/photos/wf-3.png')

    return {
        title: 'Word Fight',
        steps: [
            {
                img: one,
                text: 'Word Fight is a bit like competitive hangman. One person will pick a word to start a round. It can be any english word.'
            },
            {
                img: two,
                text: 'Everyone else will then try to guess that word, with your guesses being in alphabetical order with the hidden word. The number of question marks (?) in the hidden word tells you the length of the word.'
            },
            {
                img: three,
                text: 'The faster you guess the word, the more points you get! After everyone has chosen a word, the person with the highest score wins.'
            }
        ]
    }
}