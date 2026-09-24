import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeListener } from '../utilities/services'
import { cleanStoredData } from '../utilities/utilities'

// Leaving a game always means the same three things: forget the local game
// data, stop listening to it in the database, and go back to the menu. Views
// that hold a database listener pass it in so it is torn down on the way out.
//
// The listener is an argument to the hook rather than to the returned callback
// so that call sites can stay `onClick={goHome}`: as a callback argument it
// would receive the click event and try to unsubscribe from that instead.
export function useGoHome(listener = null) {
    const navigate = useNavigate()

    return useCallback(() => {
        cleanStoredData()
        if(listener) removeListener(listener)
        navigate('/')
    }, [listener, navigate])
}
