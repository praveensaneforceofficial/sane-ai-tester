import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

function Charts() {
  // Bar chart data - Weekly completed tasks
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed Tasks',
        data: [18, 22, 14, 28, 20, 24, 16],
        backgroundColor: '#4f46e5',
        borderRadius: 8,
      },
    ],
  }
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }
  
  // Doughnut chart data - Token usage
  const doughnutData = {
    labels: ['Used', 'Remaining'],
    datasets: [
      {
        data: [72, 28],
        backgroundColor: ['#4f46e5', '#e5e7eb'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  }
  
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
    },
  }
  
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
        <p className="text-sm text-gray-500">Tasks completed over the last 7 days</p>
      </div>
      <div className="h-64">
        <Bar data={barData} options={barOptions} />
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Token Usage</h4>
            <div className="h-40">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Project Distribution</h4>
            <div className="space-y-2">
              {[
                { name: 'Web Apps', count: 5, color: '#4f46e5' },
                { name: 'Mobile Apps', count: 4, color: '#3b82f6' },
                { name: 'API Services', count: 3, color: '#10b981' },
              ].map((project) => (
                <div key={project.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-sm text-gray-600">{project.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{project.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts