import { useState, useEffect, useCallback } from 'react'
import {
  campInfo, statVariables, outcomeChartData, screeningByDayData,
  testTypeData, patientTableData, ageGroupData, campLocationData,
} from '../data/mockData'

// Fixed dataset — no random mutations
const FIXED_DATA = {
  campInfo,
  statVariables,
  outcomeChartData,
  screeningByDayData,
  testTypeData,
  patientTableData,
  ageGroupData,
  campLocationData,
}

function simulateFetch() {
  return new Promise(resolve => {
    setTimeout(() => resolve(FIXED_DATA), 400)
  })
}

export function useDashboardData() {
  const [data,         setData]         = useState(FIXED_DATA)
  const [loading,      setLoading]      = useState(false)
  const [lastUpdated,  setLastUpdated]  = useState(() => new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const result = await simulateFetch()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh interval removed — data is fixed
  // Re-enable below if you connect a real API later:
  // useEffect(() => {
  //   const id = setInterval(() => fetchData(false), 30000)
  //   return () => clearInterval(id)
  // }, [fetchData])

  return { data, loading, lastUpdated, isRefreshing, refetch: () => fetchData(true) }
}
