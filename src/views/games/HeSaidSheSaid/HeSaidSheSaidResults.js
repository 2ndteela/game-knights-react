import React, {useState, useEffect, useMemo} from 'react'
import './he-said-she-said-styles.less'
import {getHsssGameData} from '../../../ultilites/services'
import { getStoredGameData } from '../../../ultilites/utilities'
import { Button } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons'


const startingLines = [
    'So, this one time',
    'And it came to pass',
    'Shut your gob and listen up',
    "Quit yer yappin' and hear this",
    'Once upon a time',
    "Y'all ain't gonna believe this but I seen",
    'Our story begins as many others',
    'I remember it like it was yesterday',
    'Let me tell you a story'
]

export default function HsssResults() {
    const {playerId} = getStoredGameData()
    const intro = startingLines[Math.floor(Math.random()) * startingLines.length]
    const [ storyData, setStoryData ] = useState(
        {
            state: 'ended',
            players: [
            ],
        }
    )
    const [ startIdx, setStartIdx ] = useState(playerId)
    useEffect(() => {
        async function f() {
            const data = await getHsssGameData()
            console.log(data)
            setStoryData(data)
        }

        f()
    }, [])

    const story = useMemo(() => {
        if(!storyData?.players[startIdx]?.responses?.length) {
            console.log('aborted')
            return []
        }
        let idx = startIdx
        const playerCount = storyData.players.length
        const story = []
        for(let i = 0; i < 10; i++) {
            const line = storyData.players[idx].responses[i]
            story.push(getResponseString(line))
            idx = (idx + 1) % playerCount
        }
        console.log(story)
        return story

    }, [startIdx, storyData.players])

    function addOne() {
        if(startIdx === storyData.players.length - 1)setStartIdx(0)
        else setStartIdx(startIdx + 1)
    }

    function subtractOne() {
        if(startIdx === 0) setStartIdx(storyData.players.length - 1)
        else setStartIdx(startIdx - 1)
    }

    function getResponseString(string) {
        return string ? string : 'REDACTED'
    }

    return (
        <>
            {story.length > 0 && (
                <div className='route-container' id="story-container" >
                    <div id="story-header">
                        <Button icon={<CaretLeftOutlined />} onClick={subtractOne} />
                        <h2>Story #{startIdx + 1}</h2>
                        <Button icon={<CaretRightOutlined />} onClick={addOne} />
                    </div>
                    <h3>{intro}...</h3>
                    <div className='story-row'> <span className='no-left'>{story[0]}</span> and <span>{story[1]}</span></div>
                    <div className='story-row'>Were at <span className='no-right' >{story[2]}</span>, <span>{story[3]}</span></div>
                    <div className='story-row'>When <span>{story[0]}</span> says, "<span className='no-left no-right' >{story[4]}</span>"</div>
                    <div className='story-row'>And <span>{story[1]}</span> says "<span className='no-left no-right'>{story[5]}</span>"</div>
                    <div className='story-row'>To which <span>{story[0]}</span> says "<span className='no-left no-right'>{story[6]}</span>"</div>
                    <div className='story-row'>Then <span>{story[1]}</span> says "<span className='no-left no-right'>{story[7]}</span>"</div>
                    <div className='story-row'>And so we see that <span>{story[8]}</span></div>
                    <div className='story-row'>#<span className='no-left no-right'>{story[9]}</span></div>
                </div>
            )}
            {story.length === 0 && <div className='route-container' >
                <h2>Opps</h2>
                <p>It looks like one or more of your players did not log any answers, so the game could not be completed :(</p>
            </div>}
        </>
    )
}