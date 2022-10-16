import React, {useContext, createContext, useState, useEffect} from 'react'

export const GameContext = createContext()

export default function GameContext({ children }) {
    const [gameCode, setGameCode] = useState([])
    const [gameState, setGameState] = useState([])
    const [players, setPlayers] = useState([])
    
    
    return (
        <GameContext.Provider 
            values={
                gameCode,
                gameState,
                players
            }
        >{children}<GameContext.Provider />
    )
        
}

export const useGameContext = () => useContext(GameContext)