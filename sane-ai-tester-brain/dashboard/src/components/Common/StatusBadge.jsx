import React from 'react'

const statusConfig = {
  online: { label: 'Online', className: 'bg-green-100 text-green-800' },
  offline: { label: 'Offline', className: 'bg-gray-100 text-gray-800' },
  busy: { label: 'Busy', className: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Pending', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  running: { label: 'Running', className: 'bg-purple-100 text-purple-800' },
  
  // Custom board/sprint task statuses
  'todo': { label: 'TODO', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  'test case ready': { label: 'Test Case Ready', className: 'bg-blue-50 text-blue-700 border border-blue-100' },
  'testing going': { label: 'Testing Going', className: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  'report generation': { label: 'Report Generation', className: 'bg-amber-50 text-amber-700 border border-amber-100' },
  'task completed': { label: 'Task Completed', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
}

function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status?.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-800 border border-gray-200' }
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const isPulse = status?.toLowerCase() === 'online' || status?.toLowerCase() === 'testing going';
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        isPulse ? 'bg-emerald-500 animate-pulse' : 'bg-current'
      }`} />
      {config.label}
    </span>
  )
}

export default StatusBadge