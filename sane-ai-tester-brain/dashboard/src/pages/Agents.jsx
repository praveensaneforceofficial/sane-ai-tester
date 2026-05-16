import React, { useState } from 'react'
import { useWorkerStore } from '../store/workerStore'
import StatusBadge from '../components/Common/StatusBadge'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { Cpu, Server, Wifi, WifiOff, Activity, Clock } from 'lucide-react'

function Agents() {
  const { workers, loading } = useWorkerStore()
  const [selectedAgent, setSelectedAgent] = useState(null)

  const getAgentIcon = (type) => {
    if (type?.includes('Local')) return <Server className="w-5 h-5" />
    if (type?.includes('Remote')) return <Wifi className="w-5 h-5" />
    return <Cpu className="w-5 h-5" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'offline': return 'text-gray-400'
      case 'busy': return 'text-yellow-500'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor and manage test execution agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
            </div>
            <Cpu className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-green-600">{workers.filter(w => w.status === 'online').length}</p>
            </div>
            <Wifi className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Offline</p>
              <p className="text-2xl font-bold text-gray-600">{workers.filter(w => w.status === 'offline').length}</p>
            </div>
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Tasks</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div
            key={worker.worker_id}
            className="card p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setSelectedAgent(worker)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${worker.status === 'online' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {getAgentIcon(worker.worker_type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{worker.nickname}</h3>
                  <p className="text-xs text-gray-500 font-mono">{worker.worker_id}</p>
                </div>
              </div>
              <StatusBadge status={worker.status} />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">IP Address</span>
                <span className="font-mono text-gray-900">{worker.system_ip || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">OS Platform</span>
                <span className="text-gray-900">{worker.os_platform || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Last Seen</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-900 text-xs">
                    {worker.last_seen ? new Date(worker.last_seen).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">0%</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedAgent.nickname}</h2>
              <StatusBadge status={selectedAgent.status} />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Worker ID</span>
                <span className="font-mono text-gray-900">{selectedAgent.worker_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Machine ID</span>
                <span className="font-mono text-gray-900 text-sm">{selectedAgent.machine_id?.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">IP Address</span>
                <span className="text-gray-900">{selectedAgent.system_ip || 'Not set'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">OS Platform</span>
                <span className="text-gray-900">{selectedAgent.os_platform || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Last Seen</span>
                <span className="text-gray-900">
                  {selectedAgent.last_seen ? new Date(selectedAgent.last_seen).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedAgent(null)}
              className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Agents