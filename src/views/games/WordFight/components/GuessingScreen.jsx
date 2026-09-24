import { Button, Input, Space } from 'antd'
import TimerBar from './TimerBar'

export default function GuessingScreen({ guesses, guess, onGuessChange, onSubmit, progress }) {
    return (
        <div className='main-container guessing-screen'>
            <div id='fade-wrapper'>
                <div id="top-fade" className='fader'></div>
                <div id='previous-guesses'>
                    {guesses.map((g, itr) => (
                        <h4
                            key={`${itr}-guess`}
                            className={g[0] === '?' ? 'guess-in-list bright-white' : 'guess-in-list'}
                        >{g}</h4>
                    ))}
                </div>
                <div id="bottom-fade" className='fader'></div>
            </div>

            <TimerBar percent={progress} />

            <Space.Compact className="full-width">
                <Input value={guess} onChange={e => onGuessChange(e.target.value)} className="guess-input" allowClear />
                <Button type='primary' onClick={onSubmit} >Guess</Button>
            </Space.Compact>
        </div>
    )
}
