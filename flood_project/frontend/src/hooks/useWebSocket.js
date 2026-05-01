import { useState, useEffect, useCallback, useRef } from 'react'

export default function useWebSocket(url = 'ws://localhost:8000/ws/alerts') {
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const ws = useRef(null)
    const reconnectTimeout = useRef(null)
    const connectRef = useRef(null)

    const connect = useCallback(() => {
        try {
            ws.current = new WebSocket(url)

            ws.current.onopen = () => {
                setIsConnected(true)
                console.log('[WS] Connected to alert stream')
            }

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    setMessages(prev => [data, ...prev].slice(0, 50))
                } catch {
                    console.warn('[WS] Non-JSON message:', event.data)
                }
            }

            ws.current.onclose = () => {
                setIsConnected(false)
                console.log('[WS] Disconnected, reconnecting in 5s...')
                reconnectTimeout.current = setTimeout(() => connectRef.current?.(), 5000)
            }

            ws.current.onerror = (err) => {
                console.error('[WS] Error:', err)
                ws.current?.close()
            }
        } catch (err) {
            console.error('[WS] Connection failed:', err)
            reconnectTimeout.current = setTimeout(() => connectRef.current?.(), 5000)
        }
    }, [url])

    useEffect(() => {
        connectRef.current = connect
        connect()
        return () => {
            clearTimeout(reconnectTimeout.current)
            ws.current?.close()
        }
    }, [connect])

    const sendMessage = useCallback((data) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data))
        }
    }, [])

    return { messages, isConnected, sendMessage }
}
