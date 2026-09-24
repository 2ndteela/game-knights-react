import './WordFightStyles.less'
import { useWordFightGame } from './useWordFightGame'
import GameOver from './components/GameOver'
import GuessedScreen from './components/GuessedScreen'
import GuessingScreen from './components/GuessingScreen'
import WaitingForWord from './components/WaitingForWord'
import WaitingOnGuesses from './components/WaitingOnGuesses'
import WordPicker from './components/WordPicker'

export default function WordFightMain() {
    const {
        view,
        guess,
        setGuess,
        progress,
        word,
        pickerName,
        sortedGuesses,
        sortedPlayers,
        guessers,
        otherGuessers,
        addGuess,
        setMyWord,
        goHome,
        contextHolder
    } = useWordFightGame()

    return (
        <div className="route-container" id="word-fight-container">
            {contextHolder}
            {view === 'picker' && (
                <WordPicker guess={guess} onGuessChange={setGuess} onSubmit={setMyWord} />
            )}
            {view === 'waitOnWord' && (
                <WaitingForWord pickerName={pickerName} players={sortedPlayers} />
            )}
            {view === 'guessing' && (
                <GuessingScreen
                    guesses={sortedGuesses}
                    guess={guess}
                    onGuessChange={setGuess}
                    onSubmit={addGuess}
                    progress={progress}
                />
            )}
            {view === 'waitingOnGuess' && (
                <WaitingOnGuesses players={guessers} progress={progress} />
            )}
            {view === 'guessed' && (
                <GuessedScreen word={word} players={otherGuessers} />
            )}
            {view === 'ended' && (
                <GameOver players={sortedPlayers} onHome={goHome} />
            )}
        </div>
    )
}
