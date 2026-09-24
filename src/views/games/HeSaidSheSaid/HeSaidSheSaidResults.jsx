import React, {useState, useEffect, useMemo} from 'react'
import './he-said-she-said-styles.less'
import { getHsssGameData } from '../../../utilities/services'
import { getFromLocalStorage, getStoredGameData, writeToLocalStorage } from '../../../utilities/utilities'
import { useGoHome } from '../../../hooks/useGoHome'
import { Button, Popconfirm, notification } from 'antd'
import { CaretLeftOutlined, CaretRightOutlined, UserOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { defaultPrompts } from './usePrompts'


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
    const goHome = useGoHome()
    const {playerId} = getStoredGameData()
    // Memoized so the intro stays put: picking during render would reshuffle it
    // on every state change.
    const intro = useMemo(
        () => startingLines[Math.floor(Math.random() * startingLines.length)],
        []
    )
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

        // Read and written inside the effect, and written before the
        // notification opens: StrictMode invokes this effect twice in
        // development, and a flag captured during render would still be unset
        // on the second run.
        if(!getFromLocalStorage('hsss-notified')) {
            writeToLocalStorage('hsss-notified', true)

            notification.open({
                key: 'hsss-author-tags',
                title: 'Author Tags',
                description: 'Click on any of the highlighted words to see who the author was!'
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // A host who wrote their own prompts stored them on the game. The standard
    // story is stitched together with connective text that only fits those ten
    // prompts, so a custom one is shown as each prompt with its answer under it.
    const customPrompts = useMemo(() => {
        const stored = storyData?.prompts
        return Array.isArray(stored) && stored.length ? stored : null
    }, [storyData])

    const promptCount = customPrompts ? customPrompts.length : defaultPrompts.length

    const fixedStoryArray = useMemo(() => {
        if(storyData === errorString && !dataIncomplete)
            return storyData

        const keys = Object.keys(storyData.players)
        const arr = []

        keys.forEach((k) => {
            if(dataIncomplete && storyData.players[k].responses?.length === promptCount)
                arr.push(storyData.players[k])
            else if(!dataIncomplete)
                arr.push(storyData.players[k])
        })  


        if(arr.length > 1)
            return arr
        else return []
        
    }, [dataIncomplete, promptCount, storyData])


    const story = useMemo(() => {
        try {

            if(fixedStoryArray === errorString)
                return errorString

            if(!fixedStoryArray.length) 
                return []
            
            let idx = startIdx || 0
            const playerCount = fixedStoryArray.length
            const story = []
            for(let i = 0; i < promptCount; i++) {
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

    }, [startIdx, fixedStoryArray, promptCount])

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

    function makePopConfirm(idx, padRight = true, padLeft = true) {

        const className = `${padRight ? '' :' no-right'} ${padLeft ? '' : 'no-left'}`

        if(story[idx])
            return (
                <Popconfirm title={story[idx].author} showCancel={false} icon={<UserOutlined className="author-icon" />}> 
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
                    <div className="story-body">
                        <div>
                            <h3>{intro}...</h3>
                            {customPrompts ? customPrompts.map((prompt, idx) => (
                                <div className='story-row custom-row' key={idx}>
                                    <div className='prompt-label'>{prompt}</div>
                                    <div>{makePopConfirm(idx, false, false)}</div>
                                </div>
                            )) : (<>
                            <div className='story-row'> {makePopConfirm(0, true, false)} and {makePopConfirm(1)}</div>
                            <div className='story-row'>Were at  {makePopConfirm(2, false, true)},  {makePopConfirm(3, true, true)}</div>
                            <div className='story-row'>When {makePopConfirm(0)} says, "{makePopConfirm(4, false, false)}"</div>
                            <div className='story-row'>And {makePopConfirm(1)} says "{makePopConfirm(5, false, false)}"</div>
                            <div className='story-row'>To which {makePopConfirm(0)} says "{makePopConfirm(6, false, false)}"</div>
                            <div className='story-row'>Then {makePopConfirm(1)} says "{makePopConfirm(7, false, false)}"</div>
                            <div className='story-row'>And so we see that {makePopConfirm(8)}</div>
                            <div className='story-row'>#{makePopConfirm(9, false, false)}</div>
                            </>)}
                        </div>
                        <Button 
                            type='primary' 
                            className="full-width" 
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
                    We can try to clean the data, but some players' responses may be omitted completely.
                </p>
                {dataIncomplete ? <h3>Data could not be reconciled :/</h3> : <Button onClick={() => setDataIncomplete(true)} >Attempt to fix data</Button>}
            </div>}
            {story === errorString && (
                <div className='route-container' >
                    <h3>Error retrieving story</h3>
                    <p>Looks like the story you were looking for doesn't exist or has been archived. Sorry about that :/</p>
                </div>
            )}
        </>
    )
}