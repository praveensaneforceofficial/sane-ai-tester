import React, { useState } from 'react'
import { useWorkerStore } from '../store/workerStore'
import StatusBadge from '../components/Common/StatusBadge'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { Cpu, Server, Wifi, WifiOff, Activity, Clock, Plus, Smartphone, GitFork, LayoutGrid } from 'lucide-react'

function Agents() {
  const { workers, loading } = useWorkerStore()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [viewType, setViewType] = useState('tree') // 'tree' or 'board'

  const getAgentTheme = (nickname = '', type = '', status = 'offline') => {
    const nameLower = (nickname || '').toLowerCase()
    const typeLower = (type || '').toLowerCase()
    const isMobile = nameLower.includes('mobile') || typeLower.includes('mobile') || nameLower.includes('usb')
    const isOnline = status === 'online' || status === 'busy'
    if (isMobile) {
      return {
        bg: isOnline
          ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white ring-4 ring-orange-200 shadow-lg shadow-orange-400/30'
          : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white ring-4 ring-slate-100',
        icon: <Smartphone className="w-5 h-5" />
      }
    }
    return {
      bg: isOnline
        ? 'bg-gradient-to-br from-indigo-400 to-blue-600 text-white ring-4 ring-blue-200 shadow-lg shadow-blue-500/30'
        : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white ring-4 ring-slate-100',
      icon: <Cpu className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'busy':
        return { label: 'Running', cls: 'bg-emerald-500 text-white border-emerald-400' }
      case 'online':
        return { label: 'Idle', cls: 'bg-rose-500 text-white border-rose-400' }
      default:
        return { label: 'Offline', cls: 'bg-slate-200 text-slate-500 border-slate-200' }
    }
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Upper Date Tag */}
      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-500 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Orchestration System</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Intelligent parallel test execution & agent management</p>
        </div>
      </div>

      {/* Section Divider & Toggles */}
      <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            AI Agents ({workers.length} Parallel Executors)
          </h2>
        </div>
        
        {/* Toggle Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('tree')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 shadow-sm border ${
              viewType === 'tree'
                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/10'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Tree View
          </button>
          <button
            onClick={() => setViewType('board')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 shadow-sm border ${
              viewType === 'board'
                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/10'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board View
          </button>
        </div>
      </div>

      {/* Tree View Content */}
      {viewType === 'tree' && (
        workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/60 rounded-3xl shadow-sm">
            <Cpu className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
            <p className="text-sm font-bold text-slate-400">No active parallel executors found</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full py-10 bg-white border border-slate-200/60 rounded-3xl shadow-sm relative overflow-hidden">
            {/* Master Node */}
            <div className="flex flex-col items-center relative z-10 mb-16">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-50/50 mb-3 relative animate-pulse-slow">
                <Server className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-slate-800 text-sm">AI Agent Master</h4>
                <span className="text-[10px] font-mono text-slate-400">127.0.0.1</span>
                <div className="mt-1.5">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                    Master
                  </span>
                </div>
              </div>
            </div>

            {/* Connecting SVG Curves */}
            <div className="absolute inset-x-0 top-[130px] h-[85px] pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {workers.map((w, idx) => {
                  const startX = 50;
                  const startY = 0;
                  const endX = ((idx + 0.5) / workers.length) * 100;
                  const endY = 100;
                  const pathD = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
                  return (
                    <path
                      key={w.worker_id}
                      d={pathD}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      className="transition-all duration-300 opacity-60"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Children Workers Row */}
            <div className="flex justify-around items-start w-full px-6 relative z-10 mt-2 gap-4">
              {workers.map((worker) => {
                const theme = getAgentTheme(worker.nickname, worker.worker_type, worker.status);
                const badge = getStatusBadge(worker.status);
                return (
                  <div
                    key={worker.worker_id}
                    onClick={() => setSelectedAgent(worker)}
                    className="flex flex-col items-center cursor-pointer group hover:scale-105 transition-all duration-200"
                  >
                    {/* Circle Node with pulse for active */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all ${theme.bg}`}>
                        {theme.icon}
                      </div>
                      {(worker.status === 'online' || worker.status === 'busy') && (
                        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="text-center">
                      <h5 className="font-extrabold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors max-w-[90px] truncate">
                        {worker.nickname}
                      </h5>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {worker.system_ip || `Device ID: ${worker.worker_id.substring(0, 8)}`}
                      </p>
                      
                      <div className="mt-2">
                        <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Board View Content */}
      {viewType === 'board' && (
        <>
          {/* Stats Bar */}
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

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => {
              const theme = getAgentTheme(worker.nickname, worker.worker_type);
              return (
                <div
                  key={worker.worker_id}
                  className="card p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedAgent(worker)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${worker.status === 'online' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className={worker.status === 'online' ? 'text-blue-500' : 'text-slate-400'}>
                          {theme.icon}
                        </div>
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
              );
            })}
          </div>
        </>
      )}

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