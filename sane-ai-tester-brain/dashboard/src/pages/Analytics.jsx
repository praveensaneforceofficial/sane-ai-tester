import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAnalyticsStore } from '../store/analyticsStore'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import { Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import socketService from '../services/socket'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const fmt = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function Analytics() {
  const {
    tokenUsage,
    dailyMetrics,
    projectAnalytics,
    tokenLoading,
    projectLoading,
    fetchTokenUsage,
    fetchDailyMetrics,
    fetchProjectAnalytics,
  } = useAnalyticsStore()

  const [timeRange, setTimeRange] = useState('7d')
  const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7

  useEffect(() => {
    fetchTokenUsage(days)
    fetchDailyMetrics(days)
    fetchProjectAnalytics()

    const handleUpdate = () => {
      fetchTokenUsage(days)
      fetchDailyMetrics(days)
      fetchProjectAnalytics()
    }

    socketService.on('dashboard:update', handleUpdate)
    socketService.on('update-brain', handleUpdate)

    return () => {
      socketService.off('dashboard:update', handleUpdate)
      socketService.off('update-brain', handleUpdate)
    }
  }, [days])

  if (tokenLoading && !tokenUsage) {
    return <LoadingSpinner />
  }

  // Extract totals and summary
  const totals = tokenUsage?.totals || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0, call_count: 0 }
  const summaries = tokenUsage?.summary || []
  const projectsList = projectAnalytics || []

  // Success rate computation
  const totalCalls = totals.call_count || 0
  const successCount = summaries.reduce((acc, s) => acc + (s.success_count || 0), 0)
  const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : '0'

  // Average response duration computation
  const totalDuration = summaries.reduce((acc, s) => acc + (s.avg_duration_ms * s.call_count || 0), 0)
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

  // 1. Bar Chart Data - Daily Task Trends (Completed vs Failed)
  const barData = {
    labels: dailyMetrics ? dailyMetrics.map(m => m.date.slice(5)) : [],
    datasets: [
      {
        label: 'Tasks Completed',
        data: dailyMetrics ? dailyMetrics.map(m => m.completed) : [],
        backgroundColor: '#10b981', // Emerald green
        borderRadius: 6,
      },
      {
        label: 'Tasks Failed',
        data: dailyMetrics ? dailyMetrics.map(m => m.failed) : [],
        backgroundColor: '#ef4444', // Red
        borderRadius: 6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
    },
  }

  // 2. Doughnut Chart Data - Token Distribution by Provider
  const tokenData = {
    labels: summaries.length ? summaries.map(s => s.api_type.toUpperCase()) : ['No provider'],
    datasets: [
      {
        data: summaries.length ? summaries.map(s => s.total_tokens || 1) : [1],
        backgroundColor: summaries.length
          ? summaries.map(s => s.api_type === 'openai' ? '#6366f1' : '#10b981')
          : ['#e2e8f0'],
        borderWidth: 0,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)} tokens`
        }
      }
    },
    cutout: '72%',
  }

  const getProjectStatus = (p) => {
    if (p.total_tickets > 0 && p.total_tickets === p.closed_tickets) return 'Completed'
    if (p.ai_tested_tickets > 0) return 'AI Testing'
    return 'Active'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time LLM execution metrics and task trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white text-gray-700 shadow-sm cursor-pointer"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Tokens */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Tokens Used</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{fmt(totals.total_tokens)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Prompt: {fmt(totals.prompt_tokens)} | Completion: {fmt(totals.completion_tokens)}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Zap className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Card 2: Avg Response Time */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Response Time</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{avgDuration}ms</p>
            <p className="text-xs text-gray-500 mt-1">Across {fmt(totalCalls)} API requests</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">LLM Success Rate</p>
            <p className={`text-3xl font-extrabold mt-2 ${Number(successRate) > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
              {successRate}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{fmt(successCount)} successful requests</p>
          </div>
          <div className={`p-3 rounded-lg ${Number(successRate) > 90 ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <CheckCircle2 className={`h-6 w-6 ${Number(successRate) > 90 ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Task Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Daily Task Execution</h3>
            <p className="text-xs text-gray-500">Completed and failed testing worker task runs</p>
          </div>
          <div className="h-80">
            {dailyMetrics && dailyMetrics.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <AlertCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm">No task data recorded in this range</p>
              </div>
            )}
          </div>
        </div>

        {/* Token Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900">Provider Token Split</h3>
            <p className="text-xs text-gray-500">Distribution of prompt/completion tokens by LLM API</p>
          </div>
          <div className="h-80 flex flex-col justify-between">
            <div className="flex-1 min-h-[220px]">
              <Doughnut data={tokenData} options={doughnutOptions} />
            </div>
            {summaries.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2 border-t pt-3">
                {summaries.map(s => (
                  <div key={s.api_type} className="border-r last:border-0 border-gray-100">
                    <p className="font-semibold text-gray-700 capitalize">{s.api_type}</p>
                    <p className="text-gray-500 font-medium mt-0.5">{fmt(s.total_tokens)} tokens</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Zoho Project Sync Statistics</h3>
          <p className="text-xs text-gray-500 mt-1">Aggregated ticket metrics per synchronized project</p>
        </div>
        {projectLoading && !projectAnalytics ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : projectsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No synced projects found. Run a sync from the projects screen.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Tested Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Closed Tickets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectsList.map((project, index) => {
                  const status = getProjectStatus(project)
                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{project.project_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.total_tickets}</td>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">{project.ai_tested_tickets}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.closed_tickets}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          status === 'Completed' ? 'bg-blue-50 text-blue-700' :
                          status === 'AI Testing' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics