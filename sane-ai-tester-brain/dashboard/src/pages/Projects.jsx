import React, { useState, useEffect } from 'react'
import { Plus, Folder, MoreVertical, Calendar } from 'lucide-react'
import { projectApi } from '../services/api'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import toast from 'react-hot-toast'

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [scrapedProjects, setScrapedProjects] = useState([])
  const [cachedZohoProjects, setCachedZohoProjects] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    project_name: '',
    project_jobj_id: '',
    category: 'custom',
    test_type: 'web',
    mobile_platform: [],
    description: ''
  })

  useEffect(() => {
    fetchProjects()
    const cache = localStorage.getItem('zohoSprintCache')
    if (cache) {
      setCachedZohoProjects(JSON.parse(cache))
    }
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await projectApi.getAll()
      // Fallback to array if API wraps the response
      const projectList = Array.isArray(data) ? data : (data.projects || [])
      setProjects(projectList)
    } catch (error) {
      toast.error('Failed to fetch projects')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncClick = () => {
    setSyncModalOpen(true)
    handleSync()
  }

  const handleSync = async () => {
    try {
      const response = await projectApi.sync()
      const extractedProjects = response.projects || []
      setScrapedProjects(extractedProjects)
      setShowPreviewModal(true)
      toast.success(`Successfully scraped ${extractedProjects.length} projects!`, { id: 'sync' })
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to sync projects'
      toast.error(errorMsg, { id: 'sync' })
    } finally {
      setSyncModalOpen(false)
    }
  }

  const saveScrapedProjects = () => {
    localStorage.setItem('zohoSprintCache', JSON.stringify(scrapedProjects))
    setCachedZohoProjects(scrapedProjects)
    toast.success('Saved to local browser cache!')
    setShowPreviewModal(false)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!formData.project_name) {
      toast.error('Project name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const projectPayload = {
        ...formData,
        project_jobj_id: formData.category === 'zohosprint' && formData.project_jobj_id 
                         ? formData.project_jobj_id 
                         : `local-${Date.now()}` // Generate local ID if custom
      }
      await projectApi.create(projectPayload)
      toast.success('Project created successfully')
      setShowModal(false)
      setFormData({ project_name: '', project_jobj_id: '', category: 'custom', test_type: 'web', mobile_platform: [], description: '' })
      fetchProjects()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and organize your test projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Sync Zoho
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new project or syncing from Zoho.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id || project.project_jobj_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6" />
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={project.project_name}>
                {project.project_name}
              </h3>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.active_flag ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {project.active_flag ? 'Active' : 'Inactive'}
                </span>
                <span>•</span>
                <span className="capitalize">{project.category || 'Local'}</span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Synced</span>
                </div>
                <span>
                  {project.last_synced_at 
                    ? new Date(project.last_synced_at).toLocaleDateString() 
                    : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              {formData.category === 'custom' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., E-Commerce Regression"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Zoho Project <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.project_jobj_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedProj = cachedZohoProjects.find(p => String(p.id) === String(selectedId));
                      if (selectedProj) {
                        setFormData({
                          ...formData,
                          project_jobj_id: selectedProj.id,
                          project_name: selectedProj.name
                        });
                      } else {
                        setFormData({...formData, project_jobj_id: '', project_name: ''});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" disabled>-- Select a Project from Local Cache --</option>
                    {cachedZohoProjects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name} (ID: {proj.id})</option>
                    ))}
                  </select>
                  {cachedZohoProjects.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No cached projects. Please click 'Sync Zoho' first.</p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="custom">Custom Project</option>
                  <option value="zohosprint">Zoho Sprint</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <select
                  value={formData.test_type}
                  onChange={(e) => setFormData({...formData, test_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="web">Web</option>
                  <option value="app">App</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {(formData.test_type === 'app' || formData.test_type === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Platform</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mobile_platform.includes('android')}
                        onChange={(e) => {
                          const newPlatforms = e.target.checked 
                            ? [...formData.mobile_platform, 'android']
                            : formData.mobile_platform.filter(p => p !== 'android');
                          setFormData({...formData, mobile_platform: newPlatforms});
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Android</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mobile_platform.includes('ios')}
                        onChange={(e) => {
                          const newPlatforms = e.target.checked 
                            ? [...formData.mobile_platform, 'ios']
                            : formData.mobile_platform.filter(p => p !== 'ios');
                          setFormData({...formData, mobile_platform: newPlatforms});
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">iOS</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Enter project description..."
                />
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Zoho Sync Progress Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6 shadow-sm"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Syncing Zoho Sprints</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                A browser automation window has opened. Please log in if prompted.<br/><br/>
                <span className="font-medium text-blue-600">Waiting for data extraction...</span>
              </p>
              <button
                onClick={() => setSyncModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors w-full shadow-sm"
              >
                Cancel / Hide
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scraped Projects Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Scraped Zoho Projects</h3>
                <p className="text-sm text-gray-500">Found {scrapedProjects.length} projects</p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {scrapedProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No projects were extracted.</div>
              ) : (
                <ul className="space-y-3">
                  {scrapedProjects.map((proj, idx) => (
                    <li key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center">
                      <span className="font-medium text-gray-800">{proj.name}</span>
                      <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200">ID: {proj.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveScrapedProjects}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Done (Save to Browser Cache)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
