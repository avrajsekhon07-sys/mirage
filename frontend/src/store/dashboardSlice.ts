import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { analyticsApi } from '../services/api'

interface DashboardState {
  data: any | null
  riskTrend: any[]
  heatmap: any | null
  shapExplanation: any[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: DashboardState = {
  data: null,
  riskTrend: [],
  heatmap: null,
  shapExplanation: [],
  loading: false,
  error: null,
  lastUpdated: null,
}

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getDashboard()
      return res.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load dashboard')
    }
  }
)

export const fetchRiskTrend = createAsyncThunk(
  'dashboard/fetchTrend',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getRiskTrend(days)
      return res.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load risk trend')
    }
  }
)

export const fetchHeatmap = createAsyncThunk(
  'dashboard/fetchHeatmap',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getHeatmap()
      return res.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to load heatmap')
    }
  }
)

export const fetchShapExplanation = createAsyncThunk(
  'dashboard/fetchShap',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getShapExplanation()
      return res.data
    } catch (err: any) {
      return rejectWithValue(null)
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateRiskScore(state, action) {
      if (state.data?.latest_risk_score) {
        state.data.latest_risk_score = { ...state.data.latest_risk_score, ...action.payload }
      }
    },
    addRecentTransaction(state, action) {
      if (state.data?.recent_transactions) {
        state.data.recent_transactions = [action.payload, ...state.data.recent_transactions.slice(0, 9)]
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchRiskTrend.fulfilled, (state, action) => {
        state.riskTrend = action.payload?.risk_trend || []
      })
      .addCase(fetchHeatmap.fulfilled, (state, action) => {
        state.heatmap = action.payload
      })
      .addCase(fetchShapExplanation.fulfilled, (state, action) => {
        state.shapExplanation = action.payload?.contributions || []
      })
  },
})

export const { updateRiskScore, addRecentTransaction } = dashboardSlice.actions
export default dashboardSlice.reducer
