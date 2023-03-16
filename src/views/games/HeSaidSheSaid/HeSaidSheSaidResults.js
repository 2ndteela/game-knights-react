import React, {useState, useEffect, useMemo} from 'react'
import './he-said-she-said-styles.less'
import { getHsssGameData } from '../../../ultilites/services'
import { cleanStoredData, getFromLocalStorage, getStoredGameData, writeToLocalStorage } from '../../../ultilites/utilities'
import { Button, Popconfirm, notification } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'


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

const errorString = 'Error Finding Game'

export default function HsssResults() {
    const navigate = useNavigate()
    const {playerId} = getStoredGameData()
    const intro = startingLines[Math.floor(Math.random()) * startingLines.length]
    const haveSeenNotification = getFromLocalStorage('hsss-notified')
    const [search] = useSearchParams()
    const queryId = search.get('gameCode')

    
    const [ storyData, setStoryData ] = useState(
        {
            state: 'ended',
            players: [
            ],
        }
    )
    const [ startIdx, setStartIdx ] = useState(playerId || 0)
    const [ dataIncomplete, setDataIncomplete ] = useState(false)
    
    useEffect(() => {
        async function f() {
            const data = await getHsssGameData(queryId)

            if(data)
                setStoryData(data)
            else if(!data && queryId)
                setStoryData(errorString)
        }

        f()

        if(!haveSeenNotification) {
            notification.open({
                message: 'Author Tags',
                description: 'Click on any of the highlighted words to see who the author was! (Also ignore that little "X" and click on this bubble to never see this again.)',
                onClick: () => writeToLocalStorage('hsss-notified', true)
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fixedStoryArray = useMemo(() => {
        if(storyData === errorString && !dataIncomplete)
            return storyData

        const keys = Object.keys(storyData.players)
        const arr = []

        keys.forEach((k) => {
            if(dataIncomplete && storyData.players[k].responses.length === 10)
                arr.push(storyData.players[k])
            else if(!dataIncomplete)
                arr.push(storyData.players[k])
        })  


        if(arr.length > 1)
            return arr
        else return []
        
    }, [dataIncomplete, storyData])


    const story = useMemo(() => {
        try {

            if(fixedStoryArray === errorString)
                return errorString

            if(!fixedStoryArray.length) 
                return []
            
            let idx = startIdx || 0
            const playerCount = fixedStoryArray.length
            const story = []
            for(let i = 0; i < 10; i++) {
                const next = fixedStoryArray[idx]

                const line = next.responses[i].replace("#", '')
                const author = next.name
                story.push( {
                    author,
                    text: getResponseString(line)
                })
                idx = (idx + 1) % playerCount
            }
            return story
        }
        catch(error) {
            console.error(error)
            return []
        }

    }, [startIdx, fixedStoryArray])

    function addOne() {
        if(startIdx === fixedStoryArray.length - 1) setStartIdx(0)
        else setStartIdx(startIdx + 1)
    }

    function subtractOne() {
        if(startIdx === 0) setStartIdx(fixedStoryArray.length - 1)
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

        if(story[idx])
            return (
                <Popconfirm title={story[idx].author} showCancel={false} icon={<UserOutlined style={{color: 'var(--primary)'}} />}> 
                    <span className={className}>{story[idx].text}</span>
                </Popconfirm>
            )
        return null
    }

    return (
        <>
            {story.length > 0 && story !== errorString && (
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
                        <Button 
                            type='primary' 
                            style={{width: '100%'}} 
                            onClick={goHome} 
                            size="large" 
                        >Return to home</Button>
                    </div>
                </div>
            )}
            {story.length === 0 && <div className='route-container' >
                <h2>Oops</h2>
                <p>
                    It looks like one or more of your players did not log any answers, so the game could not be completed. 
                    We can try clean the data, but some players responses may be omitted completely.
                </p>
                {dataIncomplete ? <h3>Data could not be reconciled :/</h3> : <Button onClick={() => setDataIncomplete(true)} >Attempt to fix data</Button>}
            </div>}
            {story === errorString && (
                <div className='route-container' >
                    <h3>Error retrieving story</h3>
                    <p>Look like the story you were looking for doesn't exists or has been archived. Sorry about that :/</p>
                </div>
            )}
        </>
    )
}