import React, {useContext, createContext, useState, useEffect} from 'react'
import { getGameData, listenForGameUpdates } from '../ultilites/services'
import { getStoredGameData } from '../ultilites/utilities'

export const GameContext = createContext()

export default function GameContextProvider({ children }) {
    const initialData = getStoredGameData()
    const [ playerId, setPlayerId ] = useState(initialData.playerId)
    const [ code, setCode ] = useState(initialData.gameCode)
    const [ gameData, setGameData ] = useState({ code: '', state: '', round: '', players: [], type: ''})
    const [ isListening, setIsListening ] = useState(false)

    useEffect(() => {
        updateGameData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function updateGameData() {
        const inStorage = getStoredGameData()
        setPlayerId(inStorage.playerId)
        setCode(inStorage.gameCode)
    }

    function startListeningForGame() {
        listenForGameUpdates(code, (data) => {
            console.log('update', data)
            setGameData(data)
        })
    }
    
    
    return (
        <GameContext.Provider 
            value={{
                gameData,
                playerId,
                code,
                updateGameData,
                startListeningForGame
            }}
        >
        {children}</GameContext.Provider>
    )
        
}

export const useGameContext = () => useContext(GameContext)