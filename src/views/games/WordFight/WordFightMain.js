import { Input, Button } from 'antd'
import {useState, useMemo, useEffect} from 'react'
import { listenForGameUpdates } from '../../../ultilites/services'
import { getStoredGameData } from '../../../ultilites/utilities'
import './WordFightStyles.less'

export default function WordFightMain() {
    const {playerId} = getStoredGameData()

    const [ guess, setGuess ] = useState()
    const [ guessList, setGuessList ] = useState()
    const [ listener, setListener ] = useState()

    const view = useMemo(() => {
        return 'picker'
    }, [])


    useEffect(() => {
        async function f() {
            listenForGameUpdates((data, l) => {
                console.log(data)

                if(!listener) setListener(l)
            })
        }
    }, [])

    return(
        <div className="route-container">
            {view === 'picker' && (
                <div style={{height: '100%', width: '100%', justifyContent: 'center'}} >
                    <span style={{paddingBottom: '4px'}} >Pick a word to try and trick everyone</span>
                    <Input.Group compact>
                        <Input value={guess} onChange={e => setGuess(e.target.value)} style={{ width: 'calc(100% - 76px)'}}  />
                        <Button type='primary'>Submit</Button>
                    </Input.Group>
                </div>
            )}
        </div>
    )
}