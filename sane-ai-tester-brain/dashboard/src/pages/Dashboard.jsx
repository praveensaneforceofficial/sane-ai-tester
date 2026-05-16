import React, { useEffect, useState } from 'react'
import { useWorkerStore } from '../store/workerStore'
import { useAnalyticsStore } from '../store/analyticsStore'
import KPICards from '../components/Dashboard/KPICards'
import Charts from '../components/Dashboard/Charts'
import ActiveThreads from '../components/Dashboard/ActiveThreads'
import SystemHealth from '../components/Dashboard/SystemHealth'
import HeroBanner from '../components/Dashboard/HeroBanner'
import LoadingSpinner from '../components/Common/LoadingSpinner'

function Dashboard() {
  const { workers, loading: workersLoading, fetchWorkers } = useWorkerStore()
  const { metrics, fetchMetrics } = useAnalyticsStore()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchWorkers(), fetchMetrics()])
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Charts />
        </div>
        <div className="lg:col-span-1">
          <SystemHealth onlineCount={onlineCount} totalWorkers={totalWorkers} />
        </div>
      </div>
      <ActiveThreads workers={workers} />
    </div>
  )
}

export default Dashboard