import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { setConnected, receiveEvent } from '../store/wsSlice'
import { addAlert } from '../store/alertsSlice'
import { updateRiskScore, addRecentTransaction } from '../store/dashboardSlice'
import { getWsUrl } from '../services/api'

export function useWebSocket() {
  const dispatch = useDispatch()
  const { user, token } = useSelector((s: RootState) => s.auth)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  const connect = useCallback(() => {
    if (!user || !token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const url = getWsUrl(user.id, token)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current) return
        dispatch(setConnected(true))
        console.log('[WS] Connected')
      }

      ws.onmessage = (event) => {
        if (!isMounted.current) return
        try {
          const data = JSON.parse(event.data)
          dispatch(receiveEvent(data))

          switch (data.event_type) {
            case 'transaction':
              dispatch(addRecentTransaction(data.data))
              break
            case 'risk_update':
              dispatch(updateRiskScore(data.data))
              break
            case 'alert':
              dispatch(addAlert(data.data))
              break
            case 'heartbeat':
              ws.send('ping')
              break
          }
        } catch (e) {
          console.warn('[WS] Parse error:', e)
        }
      }

      ws.onclose = (ev) => {
        if (!isMounted.current) return
        dispatch(setConnected(false))
        console.log('[WS] Closed:', ev.code, ev.reason)

        // Reconnect after 3s unless intentional close
        if (ev.code !== 1000 && isMounted.current) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = (err) => {
        console.warn('[WS] Error:', err)
        ws.close()
      }
    } catch (e) {
      console.error('[WS] Connection failed:', e)
    }
  }, [user, token, dispatch])

  useEffect(() => {
    isMounted.current = true
    connect()

    return () => {
      isMounted.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close(1000, 'Component unmounted')
    }
  }, [connect])

  return { connected: wsRef.current?.readyState === WebSocket.OPEN }
}
