import React from 'react'
import {
  LayoutDashboard, Upload, FileSearch, Github, GitPullRequest,
  Settings, ChevronDown, Cpu
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'reviews', label: 'Reviews', icon: FileSearch },
  { id: 'github', label: 'GitHub Sync', icon: Github },
  { id: 'pr-reviews', label: 'PR Reviews', icon: GitPullRequest },
]

export default function Sidebar({ activeScreen, onNavigate }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-[#111117] border-r border-[#2a2a38] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2a2a38] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Cpu size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-tight">AlphaCore</div>
          <div className="text-[10px] text-[#5a5a72] leading-tight">AI Review</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeScreen === id || (activeScreen.startsWith('step-') && id === 'upload')
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                : 'text-[#8888a8] hover:text-white hover:bg-[#1c1c26]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-2 py-4 border-t border-[#2a2a38]">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeScreen === 'settings'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
              : 'text-[#8888a8] hover:text-white hover:bg-[#1c1c26]'
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  )
}
