import PlayerCheckList from './PlayerCheckList'

export default function GuessedScreen({ word, players }) {
    return (
        <div className='main-container guessed-screen'>
            <div className='guess-finished'>
                <h3>Great work! The word was</h3>
                <h3 className="the-word" >{word}</h3>
            </div>
            <br />
            <br />
            <div className="section-heading spaced" >Other players:</div>
            <PlayerCheckList players={players} />
        </div>
    )
}
