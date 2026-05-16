import React from 'react'
import { Shield, Activity, Cpu, Wifi } from 'lucide-react'

function SystemHealth({ onlineCount, totalWorkers }) {
  const uptime = '99.9%'
  const responseTime = '124ms'
  
  return (
    <div className="card p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h3 className="font-semibold">System Health</h3>
        </div>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">v1.2.4</span>
      </div>
      
      <div className="text-3xl font-bold mb-1">{uptime}</div>
      <p className="text-white/70 text-sm mb-4">Uptime Stability</p>
      
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/80">Response Time</span>
          </div>
          <span className="text-sm font-medium">{responseTime}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/80">CPU Usage</span>
          </div>
          <span className="text-sm font-medium">32%</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/80">Active Workers</span>
          </div>
          <span className="text-sm font-medium">{onlineCount}/{totalWorkers}</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-white/20 border-2 border-indigo-500 flex items-center justify-center text-xs">
                {i}
              </div>
            ))}
          </div>
          <span className="text-xs text-white/70">{onlineCount} Agents Monitoring</span>
        </div>
      </div>
    </div>
  )
}

export default SystemHealth