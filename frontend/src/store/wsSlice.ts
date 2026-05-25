import { createSlice } from '@reduxjs/toolkit'

interface WsState {
  connected: boolean
  lastEvent: any | null
  eventLog: any[]
}

const initialState: WsState = { connected: false, lastEvent: null, eventLog: [] }

const wsSlice = createSlice({
  name: 'ws',
  initialState,
  reducers: {
    setConnected(state, action) {
      state.connected = action.payload
    },
    receiveEvent(state, action) {
      state.lastEvent = action.payload
      state.eventLog = [action.payload, ...state.eventLog.slice(0, 49)]
    },
  },
})

export const { setConnected, receiveEvent } = wsSlice.actions
export default wsSlice.reducer
