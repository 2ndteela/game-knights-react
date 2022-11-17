import React, {useState, useEffect, useMemo} from 'react'
import './he-said-she-said-styles.less'
import { getHsssGameData } from '../../../ultilites/services'
import { cleanStoredData, getFromLocalStorage, getStoredGameData, writeToLocalStorage } from '../../../ultilites/utilities'
import { Button, Popconfirm, notification } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'


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
    const navigate = useNavigate()
    const {playerId} = getStoredGameData()
    const intro = startingLines[Math.floor(Math.random()) * startingLines.length]
    const haveSeenNotification = getFromLocalStorage('notified')

    
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
            setStoryData(data)
        }

        f()

        if(!haveSeenNotification) {
            notification.open({
                message: 'Author Tags',
                description: 'Click on any of the highlighted words to see who the author was! (Also ignore that little "X" and click on this bubble to never see this again.)',
                onClick: () => writeToLocalStorage('notified', true)
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const line = storyData.players[idx].responses[i].replace("#", '')
            const author = storyData.players[idx].name
            story.push( {
                author,
                text: getResponseString(line)
             })
            idx = (idx + 1) % playerCount
        }
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

    function goHome() {
        cleanStoredData()
        navigate('/')
    }

    function makePopConfirm(idx, padRight = true, padLeft = true) {

        const className = `${padRight ? '' :' no-right'} ${padLeft ? '' : 'no-left'}`

        return (
            <Popconfirm title={story[idx].author} showCancel={false} icon={<UserOutlined style={{color: 'var(--primary)'}} />}> 
                <span className={className}>{story[idx].text}</span>
            </Popconfirm>
        )
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
                    <div style={{justifyContent: 'space-between', height: '100%', width: '100%'}}>
                        <div>
                            <h3>{intro}...</h3>
                            <div className='story-row'> {makePopConfirm(0, true, false)} and {makePopConfirm(1)}</div>
                            <div className='story-row'>Were at  {makePopConfirm(2, false, true)},  {makePopConfirm(3, true, true)}</div>
                            <div className='story-row'>When {makePopConfirm(0)} says, "{makePopConfirm(4, false, false)}"</div>
                            <div className='story-row'>And {makePopConfirm(1)} says "{makePopConfirm(5, false, false)}"</div>
                            <div className='story-row'>To which {makePopConfirm(0)} says "{makePopConfirm(6, false, false)}"</div>
                            <div className='story-row'>Then {makePopConfirm(1)} says "{makePopConfirm(7, false, false)}"</div>
                            <div className='story-row'>And so we see that {makePopConfirm(8)}</div>
                            <div className='story-row'>#{makePopConfirm(9, false, false)}</div>
                        </div>
                        <Button type='primary' style={{width: '100%'}} onClick={goHome} >Return to home</Button>
                    </div>
                </div>
            )}
            {story.length === 0 && <div className='route-container' >
                <h2>Opps</h2>
                <p>It looks like one or more of your players did not log any answers, so the game could not be completed :(</p>
            </div>}
        </>
    )
}