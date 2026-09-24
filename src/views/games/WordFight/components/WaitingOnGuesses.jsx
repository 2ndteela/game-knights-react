import PlayerCheckList from './PlayerCheckList'
import TimerBar from './TimerBar'

export default function WaitingOnGuesses({ players, progress }) {
    return (
        <div className='main-container waiting-screen'>
            <TimerBar percent={progress} />
            <h2 className="section-heading spaced">Waiting on guesses</h2>
            <PlayerCheckList players={players} />
        </div>
    )
}
