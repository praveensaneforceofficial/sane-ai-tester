import React from 'react'
import { 
  LayoutDashboard, 
  Columns, 
  Bot, 
  BarChart3, 
  FileText,
  HelpCircle,
  LogOut,
  Sparkles,
  Folder
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'sprint', label: 'Sprint Board', icon: Columns },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg">Sane-AI Brain</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Orchestration v1.0</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive 
                  ? 'bg-gray-800 text-white border-l-4 border-indigo-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-6 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
          <span>Help</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors mt-2">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar