import { Button, Input, InputNumber, Radio, Space, Tooltip, message } from "antd";
import React, {useState, useEffect, useMemo, useCallback} from 'react'
import { useSearchParams, useNavigate } from "react-router-dom";
import { openLobby, startGame, joinLobby, removeGameFromDb, removeMeFromLobby, listenForGameUpdates, removeListener } from "../utilities/services";
import { cleanStoredData, generateCode, getStoredGameData, writeNewGameData, getGameStates, getInviteLink, getHSSSTutorial, getAITutorial, getWFTutorial } from "../utilities/utilities";
import { ShareAltOutlined } from '@ant-design/icons';
import { TutorialDialog } from "../components/TutorialDialog/TutorialDialog";

export default function JoinGame() {
    const {playerId, gameCode} = getStoredGameData()
    const [ code, setCode ] = useState(gameCode)
    const [ screenName, setScreenName ] = useState()
    const [ pointsToWin, setPointsToWin ] = useState(5)
    const [ playerType, setPlayerType ] = useState('join')
    const [ joined, setJoined ] = useState(false)
    const [ peopleInLobby, setPeopleInLobby ] = useState(1)
    // Derived from the creation time, so a host's code is ready immediately with
    // no database round trip to prove it is free.
    const [ newCode, setNewCode ] = useState(generateCode)
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

    const tutorialInfo = useMemo(() => {
        if(gameType === 'hsss') return getHSSSTutorial()
        else if (gameType === 'ai') return getAITutorial()
        else if (gameType === 'wf') return getWFTutorial()

        return {}
    }, [gameType])

    const canJoin = useMemo(() => {
        if(gameType === 'hsss' && screenName && code) return true
        else if (gameType === 'wf' && screenName && code) return true
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
        if(!gameData) {
            cleanStoredData()
            return
        }

        const game = search.get('game')
        const gameStates = getGameStates(game)

        // Checked before the generic "not in the lobby any more" case below,
        // which would otherwise always win and send players into a dead game.
        if(gameData.state === gameStates.ended) {
            cleanStoredData()
            setJoined(false)
            return
        }

        if(gameData.state !== gameStates.lobby) {
            removeListener(lobbyListener)
            navigate(`/${game}`)
            return
        }

        if(gameData.players?.length) setPeopleInLobby(gameData.players.length)
    }, [gameData, lobbyListener, navigate, search])

    useEffect(() => {
        if(host) setCode(newCode)
        else setCode(search.get('gameCode') || '')
    }, [host, newCode, search])

    const radioOptions = [
        {label: 'Hosting', value: 'host'},
        {label: 'Joining', value: 'join'}
    ]

    async function joinGame() {
        const game = search.get('game')
        cleanStoredData()

        if(!game) message.warning("What type of game are you joining? Try going back to the home page and selecting your game again")
        else {
            let playerId = 0
            if(host) openLobby(code, game, screenName, pointsToWin)

            if(!host) playerId = await joinLobby(code, screenName, game)

            if(playerId > -1) {
                writeNewGameData(code, playerId)
                startListeningForGame()
                setJoined(true)
            }
            else if(playerId === -1)  message.warning("Looks like that game does not exist :/")
            else if(playerId === -2)  message.warning("You have a valid game code, but are trying to join the wrong game type.")
        }
    }

    function copySharableAddress() {
        const game = search.get('game')
        navigator.clipboard.writeText(getInviteLink(code, game));
        message.info('Address copied to clipboard')
    }

    function leaveGame() {
        if(host) {
            removeGameFromDb(code)
            // Closing a lobby retires its code, so the next one gets a fresh one.
            setNewCode(generateCode())
        }

        else
            removeMeFromLobby()

        setCode('')
        setJoined(false)
        cleanStoredData()
    }

    function beginGame() {
        const game = search.get('game')

        // He Said She Said is started from its story screen instead, where the
        // host picks the prompts: starting here would send everyone else to
        // their first prompt before the host had chosen it.
        if(game === 'hsss') {
            if(lobbyListener) removeListener(lobbyListener)
            navigate('/hsss-create')
            return
        }

        startGame(Math.floor(Math.random() * peopleInLobby))
    }

    return (
            <div className="route-container center-up" id="join-game-container">

                {!joined ? <>
                    <div className="player-type-row">
                        <span className="full-width">I am</span>
                        <Radio.Group 
                            options={radioOptions} 
                            value={playerType} 
                            onChange={e => setPlayerType(e.target.value)} 
                            optionType='button' 
                            buttonStyle="solid" 
                            className="radio-row"
                            defaultValue="join" 
                        />
                    </div>
                    <br/>
                    <span className="field-label">Game Code</span>
                    <Space.Compact className="full-width">
                        <Input
                            size="large"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            disabled={host}
                            className="code-input"
                            maxLength={6}
                        />
                        <Tooltip title="Copy invite link">
                            <Button icon={<ShareAltOutlined /> } size='large' aria-label="Copy invite link" onClick={copySharableAddress} />
                        </Tooltip>
                    </Space.Compact>
                    <br/>
                        <span className="field-label">Screen Name</span>
                        <Input size="large" value={screenName} onChange={e => setScreenName(e.target.value)} />
                    <br/>

                    {
                        gameType === 'ai' && host && (
                            <>
                                <span className="field-label">Points to win</span>
                                <InputNumber
                                    size="large"
                                    min={1}
                                    value={pointsToWin}
                                    onChange={setPointsToWin}
                                    className="full-width"
                                />
                                <br />
                            </>
                        )
                    }

                    <div className="actions-row">
                        <TutorialDialog title={tutorialInfo.title} steps={tutorialInfo.steps}  />
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
                    <h2 className="lobby-code" >{code}</h2>
                    <div>{peopleInLobby} people in lobby</div>
                    <br/>
                    <div className="lobby-actions" >
                        <Button type="primary" danger  onClick={leaveGame} >{host ? 'Close Lobby' : 'Leave Lobby'}</Button>
                        <div className="spacer-h-8"></div>
                        <Button icon={<ShareAltOutlined />} onClick={copySharableAddress} >Share</Button>
                    </div>
                    { host &&
                        (<div className="lobby-start">
                            <Button className="start-button" type="primary" onClick={beginGame}>{gameType === 'hsss' ? 'Pick Story' : 'Start Game'}</Button>
                        </div>)
                    }
                </>
                }
            </div>
    )
}