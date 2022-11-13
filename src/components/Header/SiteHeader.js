import React, { useMemo } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import {Button} from 'antd'
import { LogoutOutlined } from "@ant-design/icons"
import './SiteHeader.less'
import { cleanStoredData } from "../../ultilites/utilities"

export default function SiteHeader() {
    const navigate = useNavigate()
    const location = useLocation()
    const [search] = useSearchParams()

    function exitGame() {
        cleanStoredData()
        navigate('/')
    }

    const title = useMemo(() => {
        if(search.get('game') === 'hsss' || location.pathname.includes('hsss')) return 'He Said She Said'
        return 'Game Knights'
    }, [location, search])

    const showExit = useMemo(() => {
        if(location.pathname === '/') return false
        return true
    }, [location])

    return (      
        <header>
            <h3>{title}</h3>
            <div style={{minHeight: '32px'}} >
            { showExit && <Button 
                icon={<LogoutOutlined />} 
                shape="circle" 
                type='text' 
                onClick={exitGame}
                ></Button>}
            </div>
        </header>
    )
}