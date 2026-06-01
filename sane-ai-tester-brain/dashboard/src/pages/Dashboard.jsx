import React, { useEffect, useState } from 'react'
import { useWorkerStore } from '../store/workerStore'
import { useAnalyticsStore } from '../store/analyticsStore'
import KPICards from '../components/Dashboard/KPICards'
import ActiveThreads from '../components/Dashboard/ActiveThreads'
import HeroBanner from '../components/Dashboard/HeroBanner'
import TokenUsageChart from '../components/Dashboard/TokenUsageChart'
import LoadingSpinner from '../components/Common/LoadingSpinner'

function Dashboard() {
  const { workers, loading: workersLoading, fetchWorkers } = useWorkerStore()
  const { metrics, fetchMetrics, fetchTokenUsage } = useAnalyticsStore()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchWorkers(), fetchMetrics()])
      fetchTokenUsage(7)   // load token data in background (non-blocking)
      setIsLoading(false)
    }
    loadData()
  }, [])
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  const onlineCount = workers.filter(w => w.status === 'online').length
  const totalWorkers = workers.length
  
  return (
    <div className="space-y-6 animate-fade-in">
      <HeroBanner />
      <KPICards workers={workers} metrics={metrics} />

      {/* Token Usage Section */}
      <div className="card p-6">
        <TokenUsageChart />
      </div>

      <ActiveThreads workers={workers} />
    </div>
  )
}

export default Dashboard