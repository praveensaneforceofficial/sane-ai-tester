import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAnalyticsStore } from '../store/analyticsStore'
import LoadingSpinner from '../components/Common/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

function Analytics() {
  const { metrics, tokenUsage, loading, fetchMetrics, fetchTokenUsage } = useAnalyticsStore()
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchMetrics()
    fetchTokenUsage()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  // Bar chart data
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [12, 19, 15, 17, 14, 10, 8],
        backgroundColor: '#4f46e5',
        borderRadius: 8,
      },
      {
        label: 'Tasks Failed',
        data: [3, 2, 4, 1, 2, 1, 0],
        backgroundColor: '#ef4444',
        borderRadius: 8,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  // Token distribution doughnut
  const tokenData = {
    labels: ['Web Testing', 'API Testing', 'Mobile Testing', 'AI Analysis'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }

  // Project table data
  const projects = [
    { name: 'FMCG Portal', tests: 45, tokens: '320K', status: 'Active' },
    { name: 'Pharma One Build', tests: 78, tokens: '540K', status: 'Active' },
    { name: 'GoDiarly', tests: 112, tokens: '890K', status: 'Completed' },
    { name: 'Payroll System', tests: 34, tokens: '150K', status: 'Active' },
    { name: 'San UI Framework', tests: 92, tokens: '610K', status: 'Testing' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Token usage and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Tokens Used</p>
          <p className="text-2xl font-bold text-gray-900">2.5M</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Average Cost/Day</p>
          <p className="text-2xl font-bold text-gray-900">$0.42</p>
          <p className="text-xs text-gray-500 mt-1">~ $12.60/month</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">94.2%</p>
          <p className="text-xs text-green-600 mt-1">↑ 2.3% improvement</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Task Trends</h3>
          <div className="h-80">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Distribution by Project</h3>
          <div className="h-64">
            <Doughnut data={tokenData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Project Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{project.tests}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{project.tokens}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' :
                      project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics