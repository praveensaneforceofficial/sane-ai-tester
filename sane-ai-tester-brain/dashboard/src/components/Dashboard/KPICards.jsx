import React from 'react'
import { Users, Bot, CheckCircle, XCircle, Clock, Activity } from 'lucide-react'

function KPICards({ workers, metrics }) {
  const onlineWorkers = workers.filter(w => w.status === 'online').length
  const totalWorkers = workers.length
  const totalTasks = metrics?.task_stats?.total || 0
  const completedTasks = metrics?.task_stats?.completed || 0
  const failedTasks = metrics?.task_stats?.failed || 0
  const successRate = metrics?.task_stats?.success_rate || 0
  
  const cards = [
    {
      title: 'Total Workers',
      value: totalWorkers,
      icon: Users,
      color: 'blue',
      subtitle: `${onlineWorkers} online`,
    },
    {
      title: 'Active Agents',
      value: onlineWorkers,
      icon: Bot,
      color: 'purple',
      subtitle: `${totalWorkers - onlineWorkers} offline`,
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: CheckCircle,
      color: 'green',
      subtitle: 'Last 7 days',
    },
    {
      title: 'Failed Tasks',
      value: failedTasks,
      icon: XCircle,
      color: 'red',
      subtitle: 'Need attention',
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: Clock,
      color: 'orange',
      subtitle: 'All time',
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: Activity,
      color: 'indigo',
      subtitle: 'Passing rate',
    },
  ]
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="stat-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-600 mt-1">{card.title}</p>
            <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}

export default KPICards