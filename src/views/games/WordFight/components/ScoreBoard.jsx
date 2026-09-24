export default function ScoreBoard({ players, narrow = false }) {
    return (
        <div id="score-board" className={narrow ? 'narrow' : undefined} >
            {players.map(p => (
                <div className='score-board-row' key={p.idx}>
                    <div>{p.name}</div>
                    <div>{p.points ?? 0}</div>
                </div>
            ))}
        </div>
    )
}
