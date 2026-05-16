import React from 'react'
import { Terminal, Code, ChevronRight } from 'lucide-react'

function ActiveThreads({ workers }) {
  const activeWorkers = workers.filter(w => w.status === 'online').slice(0, 3)
  
  const getProgress = (workerId) => {
    const hash = workerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return 50 + (hash % 45)
  }
  
  const getIcon = (workerId) => {
    return workerId.includes('Local') ? Terminal : Code
  }
  
  if (activeWorkers.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Agent Threads</h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View All
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No active agents at the moment</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Agent Threads</h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {activeWorkers.map((worker) => {
          const Icon = getIcon(worker.worker_id)
          const progress = getProgress(worker.worker_id)
          
          return (
            <div key={worker.worker_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{worker.nickname}</h4>
                  <span className="text-xs text-gray-500">{worker.worker_id}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{worker.os_platform || 'Unknown'} • {worker.system_ip || 'IP not set'}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{progress}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ActiveThreads