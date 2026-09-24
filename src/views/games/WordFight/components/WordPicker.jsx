import { Button, Input, Space } from 'antd'

export default function WordPicker({ guess, onGuessChange, onSubmit }) {
    return (
        <div className='main-container'>
            <span className="pad-bottom-4" >Pick a word to try and trick everyone</span>
            <Space.Compact className="full-width">
                <Input value={guess} onChange={e => onGuessChange(e.target.value)} className="word-input" />
                <Button type='primary' onClick={onSubmit} >Submit</Button>
            </Space.Compact>
        </div>
    )
}
