import React, { useState, useEffect } from 'react'
import { Plus, Filter, RefreshCw, Layers, ExternalLink, Calendar, CheckCircle2, AlertCircle, Database, Play } from 'lucide-react'
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

  // Zoho Sprints Integration States
  const [zohoProjects, setZohoProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [sprintList, setSprintList] = useState([])
  const [selectedSprint, setSelectedSprint] = useState(null)
  const [sprintItems, setSprintItems] = useState([])
  const [showSprintItemsModal, setShowSprintItemsModal] = useState(false)
  const [loadingZoho, setLoadingZoho] = useState(false)
  const [loadingSprints, setLoadingSprints] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [isCachedData, setIsCachedData] = useState(false)
  const [zohoBoardUrl, setZohoBoardUrl] = useState('')

  // Fetch projects from backend or fallback to localStorage cache
  const loadZohoProjectsList = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.projects || [])
      // Filter Zoho Sprint projects
      const filtered = list.filter(p => p.category === 'zohosprint')
      
      if (filtered.length > 0) {
        setZohoProjects(filtered)
      } else {
        // Fallback to local storage cache
        const cache = localStorage.getItem('zohoSprintCache')
        if (cache) {
          setZohoProjects(JSON.parse(cache).map(p => ({
            project_jobj_id: p.id,
            project_name: p.name,
            category: 'zohosprint'
          })))
        }
      }
    } catch (e) {
      console.error('Failed to load Zoho projects:', e)
      // Attempt cache recovery
      const cache = localStorage.getItem('zohoSprintCache')
      if (cache) {
        setZohoProjects(JSON.parse(cache).map(p => ({
          project_jobj_id: p.id,
          project_name: p.name,
          category: 'zohosprint'
        })))
      }
    }
  }

  // Initial loads
  useEffect(() => {
    loadZohoProjectsList()
  }, [])

  // Sync projects manually using browser scraper
  const handleSyncProjects = async () => {
    setLoadingZoho(true)
    const tid = toast.loading('Syncing Zoho Projects via Puppeteer. Please wait...')
    try {
      const res = await fetch('/api/projects/sync', { method: 'POST' })
      const data = await res.json()
      await loadZohoProjectsList()
      toast.success(data.message || 'Zoho Projects successfully synchronized!', { id: tid })
    } catch (e) {
      console.error('Project sync error:', e)
      toast.error('Failed to sync projects. Verify session or retry.', { id: tid })
    } finally {
      setLoadingZoho(false)
    }
  }

  // Fetch Sprints for selected Project
  const handleFetchSprints = async (forceRefresh = false) => {
    if (!selectedProject) {
      toast.error('Please select a Zoho project first')
      return
    }

    setLoadingSprints(true)
    const cacheKey = `zohoSprintsList_${selectedProject}`
    
    // Check local cache first if not forced refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setSprintList(JSON.parse(cached))
        setLoadingSprints(false)
        toast.success('Loaded sprints from browser cache')
        return
      }
    }

    const tid = toast.loading('Fetching sprints from Zoho...')
    try {
      const res = await fetch(`/api/sprints/${selectedProject}`)
      const data = await res.json()
      if (data.success && data.sprints) {
        setSprintList(data.sprints)
        localStorage.setItem(cacheKey, JSON.stringify(data.sprints))
        toast.success(`Successfully fetched ${data.sprints.length} sprints!`, { id: tid })
      } else {
        throw new Error(data.error || 'Failed to fetch sprints')
      }
    } catch (e) {
      console.error('Fetch sprints error:', e)
      toast.error(e.message || 'Failed to fetch sprints. Try live sync.', { id: tid })
    } finally {
      setLoadingSprints(false)
    }
  }

  // Fetch items for specific Sprint
  const handleFetchSprintItems = async (sprint, forceLive = false) => {
    setSelectedSprint(sprint)
    setLoadingItems(true)
    const cacheKey = `zohoSprintItems_${selectedProject}_${sprint.id}`

    // 1. Check local cache first (instant response)
    if (!forceLive) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setSprintItems(JSON.parse(cached))
        setIsCachedData(true)
        setShowSprintItemsModal(true)
        setLoadingItems(false)
        // Also fetch board URL
        fetchBoardUrl(sprint.id)
        return
      }
    }

    // 2. Fetch live data
    const tid = toast.loading(`Fetching items for ${sprint.name}...`)
    try {
      const res = await fetch(`/api/sprints/${selectedProject}/${sprint.id}/items`)
      const data = await res.json()
      if (data.success && data.items) {
        setSprintItems(data.items)
        localStorage.setItem(cacheKey, JSON.stringify(data.items))
        setIsCachedData(false)
        setShowSprintItemsModal(true)
        toast.success(`Loaded ${data.items.length} items from Zoho!`, { id: tid })
        // Fetch board URL
        fetchBoardUrl(sprint.id)
      } else {
        throw new Error(data.error || 'Failed to fetch sprint items')
      }
    } catch (e) {
      console.error('Fetch items error:', e)
      toast.error(e.message || 'Error fetching sprint items from Zoho', { id: tid })
    } finally {
      setLoadingItems(false)
    }
  }

  // Fetch Board URL
  const fetchBoardUrl = async (sprintId) => {
    try {
      const res = await fetch(`/api/sprints/${selectedProject}/${sprintId}/board-url`)
      const data = await res.json()
      if (data.success && data.url) {
        setZohoBoardUrl(data.url)
      } else {
        setZohoBoardUrl(`https://sprints.zoho.in/workspace/sanmedia`)
      }
    } catch (e) {
      console.error('Failed to get board URL:', e)
      setZohoBoardUrl(`https://sprints.zoho.in/workspace/sanmedia`)
    }
  }

  // standard worker task handling
  useEffect(() => {
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sprint Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, sync, and track your active sprints and local tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg duration-200"
            disabled={!isConnected}
          >
            <Plus className="w-4.5 h-4.5" />
            New Local Task
          </button>
        </div>
      </div>

      {/* Zoho Sprints Integration Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-indigo-300 border border-white/10">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">Zoho Sprints Workspace</h2>
              <p className="text-xs text-slate-400 mt-0.5">Scrape, select, and manage live sprint lists directly in the dashboard</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncProjects}
              disabled={loadingZoho}
              className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold rounded-xl transition-all ${
                loadingZoho ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loadingZoho ? 'animate-spin text-indigo-400' : ''}`} />
              Sync Projects List
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Select Zoho Project */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Zoho Project</label>
            <div className="flex gap-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
              >
                <option value="" className="text-slate-900">-- Select Project --</option>
                {zohoProjects.map(proj => (
                  <option key={proj.project_jobj_id} value={proj.project_jobj_id} className="text-slate-900">
                    {proj.project_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleFetchSprints(false)}
                disabled={!selectedProject || loadingSprints}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white text-sm font-bold rounded-xl transition-all shadow-md"
              >
                {loadingSprints ? 'Loading...' : 'Sync Sprints'}
              </button>
            </div>
            {zohoProjects.length === 0 && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                No cached projects found. Run "Sync Projects List" above.
              </span>
            )}
          </div>

          {/* Sprints List Container */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sprints List ({sprintList.length})</label>
              {selectedProject && sprintList.length > 0 && (
                <button 
                  onClick={() => handleFetchSprints(true)}
                  className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Refresh List
                </button>
              )}
            </div>

            {sprintList.length === 0 ? (
              <div className="flex items-center justify-center h-[52px] border border-dashed border-white/10 rounded-xl bg-white/5 text-slate-400 text-xs">
                Select a project and click "Sync Sprints" to retrieve active sprints
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 max-h-[120px] scrollbar-thin scrollbar-thumb-white/15">
                {sprintList.map(sprint => (
                  <button
                    key={sprint.id}
                    onClick={() => handleFetchSprintItems(sprint, false)}
                    className="flex-shrink-0 flex flex-col justify-between items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl w-48 text-left transition-all duration-200 group"
                  >
                    <div className="w-full">
                      <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {sprint.name}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        ID: {sprint.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-white/5">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        sprint.isActive || sprint.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {sprint.status}
                      </span>
                      <span className="text-[9px] text-indigo-300 group-hover:underline">View Items</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Local Worker Board
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop tasks to update live worker execution statuses</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin">
        {statusColumns.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-80 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200/80 bg-white/50 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">{status}</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>

            {/* Column Body */}
            <div className="p-3 space-y-3 flex-1 min-h-[480px]">
              {tasks
                .filter(task => task.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 cursor-move hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {task.id}
                      </span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 leading-relaxed">
                      {task.name || task.prompt?.substring(0, 50)}
                    </h4>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Worker:</span>
                      <span className="font-semibold text-slate-700">{task.workerName || task.workerId}</span>
                    </div>

                    {task.priority && (
                      <span className={`inline-block mt-3 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        task.priority.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        task.priority.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}

              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <span className="text-xs">No active tasks</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h2 className="text-xl font-black text-slate-900 mb-2">Create New local Task</h2>
            <p className="text-xs text-slate-500 mb-6">Assign a testing job to one of your currently online local workers</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL to Test</label>
                <input
                  type="url"
                  value={taskUrl}
                  onChange={(e) => setTaskUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTask}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
              >
                Send Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoho Sprints Items Details Modal */}
      {showSprintItemsModal && selectedSprint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-scale-up overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center relative">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-wide">{selectedSprint.name}</h2>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isCachedData ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isCachedData ? 'Cached Data' : 'Live Synced'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Sprint ID: {selectedSprint.id} • Total items: {sprintItems.length}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFetchSprintItems(selectedSprint, true)}
                  disabled={loadingItems}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingItems ? 'animate-spin' : ''}`} />
                  Refresh Live
                </button>
                
                {zohoBoardUrl && (
                  <a
                    href={zohoBoardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Zoho Board
                  </a>
                )}

                <button 
                  onClick={() => setShowSprintItemsModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 text-white font-bold transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {sprintItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-bold text-slate-800">No items found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">There are no cards mapped to this sprint or live sync is pending.</p>
                  <button
                    onClick={() => handleFetchSprintItems(selectedSprint, true)}
                    className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Fetch Live Data Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sprintItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {item.id}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.priority.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            item.priority.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-relaxed mb-3">{item.name}</h4>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[9px] rounded uppercase">
                            {item.type || 'Task'}
                          </span>
                        </div>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200/60 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Data synced from your active Chrome/Zoho session.
              </span>
              <button
                onClick={() => setShowSprintItemsModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SprintBoard