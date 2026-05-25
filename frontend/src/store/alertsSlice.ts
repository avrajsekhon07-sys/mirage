import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { alertsApi } from '../services/api'

interface AlertsState {
  items: any[]
  loading: boolean
  error: string | null
}

const initialState: AlertsState = { items: [], loading: false, error: null }

export const fetchAlerts = createAsyncThunk('alerts/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await alertsApi.list()
    return res.data
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to load alerts')
  }
})

export const markAlertRead = createAsyncThunk('alerts/markRead', async (id: number) => {
  await alertsApi.update(id, { is_read: true })
  return id
})

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert(state, action) {
      state.items = [action.payload, ...state.items]
    },
    markAllRead(state) {
      state.items = state.items.map(a => ({ ...a, is_read: true }))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => { state.loading = true })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(markAlertRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex(a => a.id === action.payload)
        if (idx !== -1) state.items[idx].is_read = true
      })
  },
})

export const { addAlert, markAllRead } = alertsSlice.actions
export default alertsSlice.reducer
