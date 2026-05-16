import React from 'react'

const statusConfig = {
  online: { label: 'Online', className: 'bg-green-100 text-green-800' },
  offline: { label: 'Offline', className: 'bg-gray-100 text-gray-800' },
  busy: { label: 'Busy', className: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Pending', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  running: { label: 'Running', className: 'bg-purple-100 text-purple-800' },
}

function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.offline
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-current'
      }`} />
      {config.label}
    </span>
  )
}

export default StatusBadge