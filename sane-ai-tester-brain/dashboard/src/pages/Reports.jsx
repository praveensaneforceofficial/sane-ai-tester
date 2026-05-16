import React, { useState } from 'react'
import { Download, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isGenerating, setIsGenerating] = useState(false)

  const reports = [
    { id: 1, name: 'Weekly Test Summary', date: '2024-01-15', status: 'completed', type: 'summary' },
    { id: 2, name: 'Failed Tests Analysis', date: '2024-01-14', status: 'completed', type: 'failed' },
    { id: 3, name: 'Performance Report', date: '2024-01-13', status: 'completed', type: 'performance' },
    { id: 4, name: 'Token Usage Report', date: '2024-01-12', status: 'completed', type: 'token' },
  ]

  const handleGenerateReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select date range')
      return
    }
    
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      toast.success('Report generated successfully')
    }, 2000)
  }

  const handleDownload = (report) => {
    toast.success(`Downloading ${report.name}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and download test reports</p>
      </div>

      {/* Generate Report Card */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="summary">Test Summary Report</option>
            <option value="failed">Failed Tests Report</option>
            <option value="performance">Performance Report</option>
            <option value="token">Token Usage Report</option>
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{report.date}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(report)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedReport.name}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-600">Report content preview...</p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedReport)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports