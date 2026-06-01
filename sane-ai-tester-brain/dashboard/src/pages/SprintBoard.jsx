import React, { useState, useEffect, useRef } from 'react'
import { Plus, Filter, RefreshCw, Layers, ExternalLink, Calendar, CheckCircle2, AlertCircle, Database, Play, Archive } from 'lucide-react'
import { useWorkerStore } from '../store/workerStore'
import { useWebSocket } from '../hooks/useWebSocket'
import StatusBadge from '../components/Common/StatusBadge'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import toast from 'react-hot-toast'
import { customTaskApi, taskApi, reportApi } from '../services/api'

const statusColumns = ['TODO', 'Test Case Ready', 'Testing Going', 'Report Generation', 'Task Completed']

function SprintBoard() {
  const { workers, loading, fetchWorkers } = useWorkerStore()
  const { sendTask, isConnected } = useWebSocket()
  const [tasks, setTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState('')
  const [taskUrl, setTaskUrl] = useState('')

  // Custom Local Tasks States
  const [customTasks, setCustomTasks] = useState([])
  const [allProjectsList, setAllProjectsList] = useState([])
  const [newTaskProject, setNewTaskProject] = useState('')
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')

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
  const [minimizeZohoPanel, setMinimizeZohoPanel] = useState(true)
  const [loadingBrainAgent, setLoadingBrainAgent] = useState(false)
  const [isBrainAgentActive, setIsBrainAgentActive] = useState(false)
  const brainAgentIntervalRef = useRef(null)
  const [selectedDetailTask, setSelectedDetailTask] = useState(null)
  const [taskActionsHistory, setTaskActionsHistory] = useState([])
  const [loadingActions, setLoadingActions] = useState(false)

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

  const fetchCustomTasks = async () => {
    try {
      const data = await customTaskApi.getAll()
      setCustomTasks(data || [])
    } catch (e) {
      console.error('Failed to load custom tasks:', e)
    }
  }

  const executeOrchestrationRun = async (silent = false) => {
    if (!silent) setLoadingBrainAgent(true)
    let loadToast = null
    if (!silent) {
      loadToast = toast.loading('Verifying AI API availability...')
    }
    try {
      // 1. Check if AI API is available
      const aiStatus = await customTaskApi.checkAi()
      if (!aiStatus.available) {
        const errMsg = `⚠️ AI API Key/Provider Issue: ${aiStatus.error || 'AI service is currently unavailable. Please check your settings.'}`
        if (!silent) {
          toast.error(errMsg, { id: loadToast, duration: 8000 })
        } else {
          toast.error(errMsg, { duration: 8000 })
        }
        stopBrainAgentLoop()
        return
      }

      // 2. Start Brain Agent orchestration if AI is available
      if (!silent) {
        toast.loading(`AI API is available (${aiStatus.provider} - ${aiStatus.model}). Starting Brain Agent QA Director...`, { id: loadToast })
      }
      
      const result = await customTaskApi.startBrainAgent()
      if (result.error) {
        const errDesc = `Orchestration failed: ${result.error}`
        if (!silent) {
          toast.error(errDesc, { id: loadToast })
        } else {
          toast.error(errDesc)
        }
      } else {
        const msgList = result.messages || []
        if (msgList.length > 0) {
          if (!silent) {
            toast.success(`Orchestration Complete! Processed ${result.processed_todo} tasks.`, { id: loadToast })
          }
          msgList.forEach(m => toast.success(`🤖 AI Task Update: ${m}`, { duration: 8000 }))
        } else if (!silent) {
          toast.success(`Brain Agent analyzed state using ${aiStatus.provider}: everything up to date!`, { id: loadToast })
        }
        // Refresh custom tasks
        fetchCustomTasks()
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message;
      const isOffline = serverMsg.includes('not connected') || serverMsg.toLowerCase().includes('offline') || err.message?.includes('503');
      const errTxt = isOffline ? 'Brain is offline' : `Failed to trigger Brain Agent: ${serverMsg}`;
      
      if (!silent) {
        toast.error(errTxt, { id: loadToast })
      } else {
        toast.error(errTxt)
      }
      
      if (isOffline) {
        stopBrainAgentLoop()
      }
    } finally {
      if (!silent) setLoadingBrainAgent(false)
    }
  }

  const startBrainAgentLoop = () => {
    setIsBrainAgentActive(true)
    toast.success('🤖 Sane AI Agent Daemon started! Operating continuously.')
    
    // Run the first check immediately
    executeOrchestrationRun(false)

    // Set up repeating interval (every 8 seconds)
    brainAgentIntervalRef.current = setInterval(() => {
      executeOrchestrationRun(true)
    }, 8000)
  }

  const stopBrainAgentLoop = () => {
    if (brainAgentIntervalRef.current) {
      clearInterval(brainAgentIntervalRef.current)
      brainAgentIntervalRef.current = null
    }
    setIsBrainAgentActive(false)
    toast.success('🛑 Sane AI Agent Daemon stopped.')
  }

  const handleStartBrainAgent = () => {
    if (isBrainAgentActive) {
      stopBrainAgentLoop()
    } else {
      startBrainAgentLoop()
    }
  }

  const handleArchiveTask = async (e, customTaskId) => {
    e.stopPropagation()
    const tid = toast.loading('Archiving task...')
    try {
      await customTaskApi.delete(customTaskId)
      toast.success('Task archived successfully!', { id: tid })
      fetchCustomTasks()
    } catch (err) {
      toast.error('Failed to archive task.', { id: tid })
    }
  }

  const handleOpenTaskDetails = async (task) => {
    setSelectedDetailTask(task)
    setTaskActionsHistory([])
    
    setLoadingActions(true)
    try {
      let finalActions = [];
      
      if (task.isCustom) {
        // Fetch actions from our dedicated custom_task_actions DB table
        const actions = await customTaskApi.getActions(task.id)
        finalActions = (Array.isArray(actions) ? actions : []).map(act => ({
          id: act.id,
          step_number: null,
          action_type: act.action_type,
          selector: null,
          value: act.description,
          success: true,
          error_message: null,
          executed_at: act.created_at
        }))
        console.log(finalActions);
      } else {
        const nodeTaskId = task.id
        if (nodeTaskId) {
          const actions = await taskApi.getActions(nodeTaskId)
          finalActions = Array.isArray(actions) ? [...actions] : []
        }
      }
      
      // Fetch report for both task types
      if (task.id) {
        try {
          const reportData = await reportApi.getByTaskId(task.id)
          if (reportData && reportData.summary) {
            let videoUrl = null;
            if (reportData.report_data && typeof reportData.report_data === 'object' && reportData.report_data.videoUrl) {
              videoUrl = reportData.report_data.videoUrl;
            } else if (reportData.video_path) {
              videoUrl = reportData.video_path;
            }
            
            let detailsText = `📝 AI Summary Generated:\n${reportData.summary}`;
            
            finalActions.push({
              action_id: `report-${reportData.report_id}`,
              action_type: 'REPORT GENERATED',
              status: 'success',
              details: detailsText,
              video_url: videoUrl,
              executed_at: reportData.created_at
            })
          }
        } catch (e) {
          console.log('No report found for this task yet')
        }
      }
      
      setTaskActionsHistory(finalActions)
    } catch (err) {
      console.error('Failed to fetch task actions history:', err)
    } finally {
      setLoadingActions(false)
    }
  }

  const fetchAllProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.projects || [])
      setAllProjectsList(list)
    } catch (e) {
      console.error('Failed to load projects list:', e)
    }
  }

  // Initial loads
  useEffect(() => {
    loadZohoProjectsList()
    fetchCustomTasks()
    fetchAllProjects()
    return () => {
      if (brainAgentIntervalRef.current) {
        clearInterval(brainAgentIntervalRef.current)
      }
    }
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

  const handleDrop = async (newStatus) => {
    if (draggedTask) {
      if (draggedTask.isCustom) {
        const statusDbValue = newStatus === 'TODO' ? 'todo' : newStatus;
        try {
          await customTaskApi.updateStatus(draggedTask.id, statusDbValue);
          toast.success(`Task status updated to ${newStatus}`);
          fetchCustomTasks();
        } catch (e) {
          toast.error('Failed to update task status');
        }
      } else {
        setTasks(tasks.map(t => 
          t.id === draggedTask.id ? { ...t, status: newStatus } : t
        ))
        toast.success(`Task moved to ${newStatus}`)
      }
      setDraggedTask(null)
    }
  }

  const handleCreateLocalTask = async (e) => {
    e.preventDefault()
    if (!newTaskProject) {
      toast.error('Please select a project')
      return
    }
    if (!newTaskName) {
      toast.error('Task name/title is required')
      return
    }

    const tid = toast.loading('Creating local task...')
    try {
      await customTaskApi.create({
        project_jobj_id: newTaskProject,
        title: newTaskName,
        description: newTaskDescription,
        priority: newTaskPriority,
        status: 'todo'
      })
      toast.success('Local task created successfully!', { id: tid })
      setShowTaskModal(false)
      // Reset form fields
      setNewTaskProject('')
      setNewTaskName('')
      setNewTaskDescription('')
      setNewTaskPriority('medium')
      
      // Refresh list
      fetchCustomTasks()
    } catch (e) {
      console.error(e)
      toast.error('Failed to create local task', { id: tid })
    }
  }

  const parseTaskPromptAndLogs = (promptText) => {
    if (!promptText) return { cleanText: '', logs: [] }
    const lines = promptText.split('\n')
    const logs = []
    const cleanLines = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('[FAILED:') || trimmed.startsWith('[SUCCESS:')) {
        const isSuccess = trimmed.startsWith('[SUCCESS:')
        const colonIdx = trimmed.indexOf(':')
        const content = trimmed.substring(colonIdx + 1, trimmed.length - 1).trim()
        logs.push({
          type: isSuccess ? 'success' : 'failed',
          message: content
        })
      } else {
        cleanLines.push(line)
      }
    }
    return {
      cleanText: cleanLines.join('\n').trim(),
      logs: logs
    }
  }

  const allBoardTasks = [
    ...tasks,
    ...customTasks.map(ct => ({
      id: ct.custom_task_id,
      name: ct.title,
      prompt: ct.description,
      status: ct.status === 'todo' ? 'TODO' : ct.status,
      priority: ct.priority,
      workerName: ct.project_name || 'Local Task',
      workerId: 'Local Task',
      isCustom: true,
      rawTask: ct
    }))
  ]

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

        <div className={`relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 ${minimizeZohoPanel ? '' : 'pb-6 border-b border-white/10'}`}>
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
            <button
              onClick={() => setMinimizeZohoPanel(!minimizeZohoPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {minimizeZohoPanel ? 'Expand Details' : 'Minimize'}
            </button>
          </div>
        </div>

        {!minimizeZohoPanel && (
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
        )}
      </div>

      {/* Kanban Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Worker Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop tasks to update live worker execution statuses</p>
        </div>
        <div>
          <button
            onClick={handleStartBrainAgent}
            disabled={loadingBrainAgent}
            className={`relative group overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_18px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.45)] hover:scale-[1.03] active:scale-[0.97] border border-white/10 text-white text-xs font-black tracking-widest uppercase ${
              isBrainAgentActive 
                ? 'bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600'
            } ${loadingBrainAgent ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isBrainAgentActive ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            ) : (
              <Play className={`w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110 ${loadingBrainAgent ? 'animate-spin' : ''}`} />
            )}
            <span className="relative z-10">
              {loadingBrainAgent 
                ? 'Verifying AI...' 
                : isBrainAgentActive 
                ? 'Stop Brain Agent' 
                : 'Start Brain Agent'}
            </span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3.5 overflow-x-auto pb-6 scrollbar-thin">
        {statusColumns.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-[245px] bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-200/85 bg-white/55 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-extrabold text-slate-600 text-[11px] tracking-wider uppercase">{status}</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {allBoardTasks.filter(t => t.status === status).length}
              </span>
            </div>

            {/* Column Body */}
            <div className="p-2.5 space-y-2.5 flex-1 min-h-[480px]">
              {allBoardTasks
                .filter(task => task.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onClick={() => handleOpenTaskDetails(task)}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-200/80 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2 overflow-hidden">
                      <span className="text-[9px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md truncate whitespace-nowrap min-w-0">
                        {task.id}
                      </span>
                      <div className="flex-shrink-0">
                        <StatusBadge status={task.status} size="xs" />
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-[12.5px] mb-2 line-clamp-2 leading-relaxed">
                      {task.name || task.prompt?.substring(0, 50)}
                    </h4>
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{task.isCustom ? 'Project:' : 'Worker:'}</span>
                      <span className="font-semibold text-slate-600 line-clamp-1 max-w-[120px] text-right">{task.workerName || task.workerId}</span>
                    </div>

                    {task.priority && (
                      <span className={`inline-block mt-2.5 text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        task.priority.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        task.priority.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {task.priority}
                      </span>
                    )}

                    {task.status === 'Task Completed' && task.isCustom && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={(e) => handleArchiveTask(e, task.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-all shadow-sm hover:shadow"
                        >
                          <Archive className="w-3 h-3" />
                          Archive Task
                        </button>
                      </div>
                    )}
                  </div>
                ))}

              {allBoardTasks.filter(t => t.status === status).length === 0 && (
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
            <h2 className="text-xl font-black text-slate-900 mb-2">Create New Local Task</h2>
            <p className="text-xs text-slate-500 mb-6">Create a manual task to track local workflow on the board</p>
            
            <form onSubmit={handleCreateLocalTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Project <span className="text-red-500">*</span></label>
                <select
                  required
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="" disabled>-- Select Project --</option>
                  {allProjectsList.map((proj) => (
                    <option key={proj.project_jobj_id} value={proj.project_jobj_id}>
                      {proj.project_name} (ID: {proj.project_jobj_id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task details..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
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

      {/* Task Details and Execution History Modal */}
      {selectedDetailTask && (() => {
        const { cleanText, logs: parsedLogs } = parseTaskPromptAndLogs(selectedDetailTask.prompt)
        // For custom tasks, skip parsed prompt logs to render action timeline purely from custom_task_actions table
        const logsToUse = selectedDetailTask.isCustom ? [] : parsedLogs;
        
        const allLogs = [
          ...logsToUse.map((log, index) => ({
            action_id: `parsed-log-${index}`,
            action_type: log.type === 'success' ? 'SUCCESS REPORT' : 'EXECUTION LOG',
            status: log.type === 'success' ? 'success' : 'failed',
            details: log.message,
            created_at: null
          })),
          ...taskActionsHistory.map(action => {
            const actionId = action.action_id || action.id;
            const type = action.action_type || 'Run Step';
            
            let status = 'pending';
            if (action.status) {
              status = action.status;
            } else if (action.success !== undefined) {
              status = action.success ? 'success' : 'failed';
            }
            
            const details = action.details || action.value || action.error_message || '';
            const created = action.created_at || action.executed_at || null;
            const screenshot = action.screenshot_url || action.screenshot_path || null;
            const videoUrl = action.video_url || null;

            return {
              action_id: actionId,
              action_type: type,
              status: status,
              details: details,
              screenshot_url: screenshot,
              video_url: videoUrl,
              created_at: created
            };
          })
        ]

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 animate-scale-up overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex justify-between items-center relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold font-mono text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md">
                      {selectedDetailTask.id}
                    </span>
                    <StatusBadge status={selectedDetailTask.status} size="sm" />
                    {selectedDetailTask.priority && (
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        selectedDetailTask.priority.toLowerCase() === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        selectedDetailTask.priority.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {selectedDetailTask.priority}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{selectedDetailTask.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedDetailTask(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors ml-4 outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/50">
                
                {/* Left Column: Details & Scope Mapping */}
                <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Scope Mapping */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Mapping</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Project Name</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                          {selectedDetailTask.workerName || 'ABC'}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Category</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                          {selectedDetailTask.isCustom ? 'Custom / Zoho Sprint' : 'Zoho Sprint'}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Task Origin</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                          {selectedDetailTask.isCustom ? 'Manual Local Task' : 'Worker Registry Task'}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Target Host / Worker</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block line-clamp-1">
                          {selectedDetailTask.workerId || 'Web One Build'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Requirement / Description */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original Task / Requirement Description</h3>
                    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase mb-2 tracking-wider">Requirement / Description</span>
                      <div className="text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap font-mono">
                        {cleanText || 'No description provided.'}
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Instructions */}
                  {selectedDetailTask.isCustom && selectedDetailTask.rawTask?.test_instructions && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        AI-Generated Test Cases & Instructions
                      </h3>
                      <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-indigo-950 text-xs font-medium leading-relaxed whitespace-pre-wrap shadow-sm font-mono">
                        {selectedDetailTask.rawTask.test_instructions}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Unified Execution History & Logs */}
                <div className="p-6 flex flex-col overflow-y-auto bg-slate-50/20">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Real-time Execution History & Logs
                  </h3>

                  {loadingActions ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                      <span className="text-xs font-semibold">Fetching latest execution logs...</span>
                    </div>
                  ) : allLogs.length > 0 ? (
                    <div className="flex-1 space-y-3.5 pr-1 overflow-y-auto">
                      {allLogs.map((action, index) => (
                        <div key={action.action_id || index} className="flex gap-3 relative">
                          {/* Timeline Connector Line */}
                          {index < allLogs.length - 1 && (
                            <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200"></div>
                          )}
                          
                          {/* Status Dot */}
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 border ${
                            action.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            action.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            'bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          </div>

                          {/* Action Content */}
                          <div className="flex-1 bg-white border border-slate-200/60 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${
                                action.status === 'success' ? 'text-emerald-600' :
                                action.status === 'failed' ? 'text-rose-600' :
                                'text-indigo-600'
                              }`}>
                                {action.action_type || 'Run Step'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {action.created_at ? new Date(action.created_at).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            {action.details && (
                              <p className="text-[11px] font-medium text-slate-600 leading-relaxed mt-1 whitespace-pre-wrap font-mono bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                {action.details}
                              </p>
                            )}
                            {action.screenshot_url && (
                              <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 shadow-sm max-w-[200px]">
                                <img src={action.screenshot_url} alt="Action step screenshot" className="w-full h-auto object-cover max-h-[120px]" />
                              </div>
                            )}
                            {action.video_url && (
                              <div className="mt-3">
                                <a href={action.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors shadow-sm">
                                  <Play className="w-3.5 h-3.5" />
                                  Watch Execution Video
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center pt-2">[END]</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-16 text-center text-slate-400 bg-white border border-dashed border-slate-200/60 rounded-3xl p-6 shadow-inner">
                      <CheckCircle2 className="w-12 h-12 text-slate-200 mb-3" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        {selectedDetailTask.status === 'Testing Going' ? 'Agent Actively Testing' : 'Awaiting Execution'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                        {selectedDetailTask.status === 'Testing Going' 
                          ? 'Worker Agent is running page validations. Live steps will render here as soon as they report.' 
                          : selectedDetailTask.status === 'TODO' 
                          ? 'Task is queued in TODO column. Click "Start Brain Agent" to trigger AI planning.'
                          : selectedDetailTask.status === 'Test Case Ready'
                          ? 'AI has successfully pre-planned test instructions. Awaiting online worker registry scheduling.'
                          : 'No standard execution logs recorded for this task.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-100 border-t border-slate-200/60 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedDetailTask.isCustom && selectedDetailTask.rawTask?.updated_at 
                    ? `Last updated: ${new Date(selectedDetailTask.rawTask.updated_at).toLocaleString()}` 
                    : 'Sane AI Real-time Tracking.'}
                </span>
                <button
                  onClick={() => setSelectedDetailTask(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-sm outline-none shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default SprintBoard