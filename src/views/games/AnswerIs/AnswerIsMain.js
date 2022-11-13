import { Input } from 'antd'
import React, {useState, useMemo} from 'react'
import { listenForGameState, removeListener } from '../../../ultilites/services'
import { getGameStates } from '../../../ultilites/utilities'
import './AnswerIsStyles.less'

export default function AnswerIsMain() {
    const gameStates = getGameStates('ai')

    const [ listener, setListener ] = useState()

    
    const getGameStateListener = useMemo(() => {
        listenForGameState((data, l) => {
            if(data.state === gameStates.ended) 
                if(listener) removeListener(l)

            else {
                if(!listener) setListener(l)
            }

        })
    }, [gameStates, listener])

    return (
        <div className='route-container' id="answer-is-responses">
            <span>What is your response?</span>
            <Input></Input>
        </div>
    )
}