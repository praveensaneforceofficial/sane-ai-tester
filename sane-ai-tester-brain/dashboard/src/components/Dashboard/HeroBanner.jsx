import React from 'react'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'

function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">AI Orchestration System</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Compute Infrastructure</h2>
        <p className="text-gray-300 text-sm mb-4">
          Global nodes are operating at 94% efficiency across 3 clusters
        </p>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm">+24% this week</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">124ms avg response</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroBanner