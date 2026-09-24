import { Button } from 'antd'
import ScoreBoard from './ScoreBoard'

export default function GameOver({ players, onHome }) {
    return (
        <div className='main-container centered'>
            <h1>Game Over</h1>
            <div>Congrats to {players[0]?.name}!</div>
            <br />
            <ScoreBoard players={players} narrow />
            <br />
            <br />
            <Button type='primary' onClick={onHome} >Return To Home</Button>
        </div>
    )
}
