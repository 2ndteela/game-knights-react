import { Button, Input, Radio, Tooltip, message } from "antd";
import React, {useState, useEffect, useMemo, useCallback} from 'react'
import { useSearchParams, useNavigate } from "react-router-dom";
import { getNewGameCode, openLobby, startGame, joinLobby, removeGameFromDb, removeMeFromLobby, listenForGameUpdates, removeListener } from "../ultilites/services";
import { cleanStoredData, getStoredGameData, writeNewGameData, getGameStates } from "../ultilites/utilities";
import { ShareAltOutlined } from '@ant-design/icons';

export default function JoinGame() {
    const {playerId, gameCode} = getStoredGameData()
    const [ code, setCode ] = useState(gameCode)
    const [ screenName, setScreenName ] = useState()
    const [ pointsToWin, setPointsToWin ] = useState(5)
    const [ playerType, setPlayerType ] = useState('join')
    const [ joined, setJoined ] = useState(false)
    const [ peopleInLobby, setPeopleInLobby ] = useState(1)
    const [ newCode, setNewCode ] = useState()
    const [ gameData, setGameData ] = useState()
    const [ lobbyListener, setLobbyListener ] = useState(null)
    
    const [search] = useSearchParams()
    const navigate = useNavigate()

    const host = useMemo(() => {
        return playerType === 'host' || playerId === 0
    }, [playerType, playerId])

    const gameType = useMemo(() => {
        return search.get('game')
    }, [search])

    const canJoin = useMemo(() => {
    if(gameType === 'hsss' && screenName && code) return true
    else if(gameType === 'ai') {
        if(host && screenName && code && pointsToWin) return true
        else if(screenName && code) return true
    } 
    return false
    }, [gameType, screenName, code, host, pointsToWin])

    const startListeningForGame = useCallback(() => {
        if(code)
            listenForGameUpdates((data, listener) => {
                setGameData(data)
                setLobbyListener(listener)
            })
    }, [code])

    useEffect(() => {
        if(!gameData) cleanStoredData()

        else if(gameData) {
            const game = search.get('game')
            const gameStates = getGameStates(game) 

            if(gameData.state !== gameStates.lobby) {
                removeListener(lobbyListener)
                navigate(`/${game}`)
            }

            else if(gameData.state === gameStates.ended) {
                cleanStoredData()

            }

            else if(gameData.players?.length) setPeopleInLobby(gameData.players.length)
        }

        else {

            if(code && !lobbyListener) 
                startListeningForGame()
            else
                setJoined(false)
        }
    }, [code, gameData, lobbyListener, navigate, search, startListeningForGame])

    useEffect(() => {
        if(host) {
            if(!newCode)
                getNewGameCode().then(data => {
                    setNewCode(data)
                })
            else setCode(newCode)
        }
        else setCode('')
    }, [host, newCode])

    const radioOptions = [
        {label: 'Hosting', value: 'host'},
        {label: 'Joining', value: 'join'}
    ]

    async function joinGame() {
        const game = search.get('game')
        cleanStoredData()

        if(!game) message.warning("What type of game are your joining? Try going back to the home page and selecting your game again")
        else {
            let playerId = 0
            if(host) openLobby(code, game, screenName, pointsToWin)

            if(!host) playerId = await joinLobby(code, screenName)

            writeNewGameData(code, playerId)
            startListeningForGame()
            setJoined(true)
        }
    }

    function copySharableAddress() {
        const game = search.get('game')
        navigator.clipboard.writeText(`https://gameknights.web.app/join-game?gameCode=${code}&game=${game}`);
        message.info('Address copied to clip board')
    }

    function leaveGame() {
        if(host) {
            removeGameFromDb(code)
            setNewCode('')
        }

        else
            removeMeFromLobby()

        setCode('')
        setJoined(false)
        cleanStoredData()
    }

    function beginGame() {
        startGame()
    }

    return (
            <div className="route-container center-up" style={{justifyContent: 'center'}}>
                {!joined ? <>
                    <div style={{flexDirection: 'row', width: '100%', alignItems: 'center', paddingBottom: '16px'}}>
                        <span style={{width: '100%', paddingBottom: '2px'}}>I am</span>
                        <Radio.Group 
                            options={radioOptions} 
                            value={playerType} 
                            onChange={e => setPlayerType(e.target.value)} 
                            optionType='button' 
                            buttonStyle="solid" 
                            style={{flexDirection: 'row'}}
                            defaultValue="join" 
                        />
                    </div>
                    <br/>
                    <span style={{width: '100%'}}>Game Code</span>
                    <Input.Group compact>
                        <Input 
                            size="large" 
                            value={code} 
                            onChange={e => setCode(e.target.value.toUpperCase())} 
                            disabled={host} 
                            style={{width: 'calc(100% - 40px)'}} 
                            maxLength={6}
                        />
                        <Tooltip>
                            <Button icon={<ShareAltOutlined /> } size='large' onClick={copySharableAddress} />
                        </Tooltip>
                    </Input.Group>
                    <br/>
                        <span style={{width: '100%'}}>Screen Name</span>
                        <Input size="large" value={screenName} onChange={e => setScreenName(e.target.value)} />
                    <br/>

                    {
                        gameType === 'ai' && host && (
                            <>
                                <span style={{width: '100%'}}>Points to win</span>
                                <Input size="large" value={pointsToWin} onChange={e => setPointsToWin(e.target.value)} />
                                <br />
                            </>
                        )
                    }

                    <div style={{alignItems: "flex-end", width: '100%'}}>
                        <Button type="primary" onClick={joinGame} disabled={!canJoin} >{ host ? 'Open Lobby' : 'Join Game'}</Button>
                    </div>
                </> :
                <>
                    {!host &&
                        (<>
                            <div>Waiting on the host to start the game</div>
                            <div>People can still join with this game code:</div>
                            <br />

                        </>)

                    }
                    <h2 style={{color: 'var(--primary)'}} >{code}</h2>
                    <div>{peopleInLobby} people in Lobby</div>
                    <br/>
                    <div style={{flexDirection: 'row', width: '200px'}} >
                        <Button type="primary" danger  onClick={leaveGame} >{host ? 'Close Lobby' : 'Leave Lobby'}</Button>
                        <div style={{width: '8px'}}></div>
                        <Button icon={<ShareAltOutlined />} onClick={copySharableAddress} >Share</Button>
                    </div>
                    { host &&
                        (<div style={{paddingTop: '8px', width: '200px'}}>
                            <Button style={{width: '200px'}} type="primary" onClick={beginGame}>Start Game</Button>
                        </div>)
                    }
                </>
                }
            </div>
    )
}