import React, { useState, useEffect } from 'react'
import { Plus, Filter } from 'lucide-react'
import { useWorkerStore } from '../store/workerStore'
import { useWebSocket } from '../hooks/useWebSocket'
import StatusBadge from '../components/Common/StatusBadge'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import toast from 'react-hot-toast'

const statusColumns = ['TODO', 'Test Case Ready', 'Testing Going', 'Report Generation', 'Task Completed']

function SprintBoard() {
  const { workers, loading, fetchWorkers } = useWorkerStore()
  const { sendTask, isConnected } = useWebSocket()
  const [tasks, setTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState('')
  const [taskUrl, setTaskUrl] = useState('')

  useEffect(() => {
    // Load tasks from workers
    const loadTasks = async () => {
      const allTasks = []
      for (const worker of workers) {
        const workerTasks = worker.tasks || []
        allTasks.push(...workerTasks.map(t => ({ ...t, workerId: worker.worker_id, workerName: worker.nickname })))
      }
      setTasks(allTasks)
    }
    loadTasks()
  }, [workers])

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (newStatus) => {
    if (draggedTask) {
      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      ))
      setDraggedTask(null)
      toast.success(`Task moved to ${newStatus}`)
    }
  }

  const handleSendTask = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker')
      return
    }
    if (!taskUrl) {
      toast.error('Please enter a URL')
      return
    }

    const success = sendTask(selectedWorker, taskUrl, `Test ${taskUrl}`)
    if (success) {
      toast.success('Task sent successfully')
      setShowTaskModal(false)
      setTaskUrl('')
      setSelectedWorker('')
      fetchWorkers()
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprint Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track test tasks</p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={!isConnected}
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-xl"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{status}</h3>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-3 min-h-[500px]">
              {tasks
                .filter(task => task.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-indigo-600">{task.id}</span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">{task.name || task.prompt?.substring(0, 50)}</h4>
                    <p className="text-xs text-gray-500">Worker: {task.workerName || task.workerId}</p>
                    {task.priority && (
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a worker...</option>
                  {workers.filter(w => w.status === 'online').map((worker) => (
                    <option key={worker.worker_id} value={worker.worker_id}>
                      {worker.nickname} ({worker.worker_id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL to Test</label>
                <input
                  type="url"
                  value={taskUrl}
                  onChange={(e) => setTaskUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTask}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Send Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SprintBoard