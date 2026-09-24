import React, { useMemo } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import {Button} from 'antd'
import { LogoutOutlined } from "@ant-design/icons"
import { useGoHome } from "../../hooks/useGoHome"

export default function SiteHeader() {
    const location = useLocation()
    const [search] = useSearchParams()
    const goHome = useGoHome()

    const title = useMemo(() => {
        if(search.get('game') === 'hsss' || location.pathname.includes('hsss')) return 'He Said She Said'
        if(search.get('game') === 'ai' || location.pathname === '/ai') return 'Answer Is'
        if(search.get('game') === 'wf' || location.pathname === '/wf') return 'Word Fight'
        return 'Game Knights'
    }, [location, search])

    const showExit = useMemo(() => {
        if(location.pathname === '/') return false
        return true
    }, [location])

    return (      
        <header>
            <h3>{title}</h3>
            <div className="exit-slot" >
            { showExit && <Button 
                icon={<LogoutOutlined />} 
                shape="circle" 
                type='text' 
                onClick={goHome}
                ></Button>}
            </div>
        </header>
    )
}