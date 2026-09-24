import ScoreBoard from './ScoreBoard'

export default function WaitingForWord({ pickerName, players }) {
    return (
        <div className='main-container centered' >
            <div className="full-width" >Waiting on {pickerName} to pick a word</div>
            <br />
            <h2 className="section-heading" >Scoreboard</h2>
            <ScoreBoard players={players} />
        </div>
    )
}
