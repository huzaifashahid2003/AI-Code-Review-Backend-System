import React from 'react'
import { Bell, ChevronDown, Search } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Analyze' },
  { id: 3, label: 'Review Issues' },
  { id: 4, label: 'Apply Fixes' },
  { id: 5, label: 'Re-run' },
]

const stepScreenMap = {
  'step-upload': 1,
  'step-analyze': 2,
  'step-review': 3,
  'step-fix': 4,
  'step-rerun': 5,
}

export default function Navbar({ activeScreen }) {
  const currentStep = stepScreenMap[activeScreen] || null

  return (
    <header className="h-14 border-b border-[#2a2a38] bg-[#111117] flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Project selector */}
      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c26] border border-[#2a2a38] rounded-lg text-sm text-white hover:border-[#3a3a4e] transition-colors">
        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
        <span className="font-medium">AlphaCore AI</span>
        <ChevronDown size={14} className="text-[#5a5a72]" />
      </button>

      {/* Step progress - only show when in workflow */}
      {currentStep && (
        <div className="flex items-center gap-1 flex-1 justify-center">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                step.id === currentStep
                  ? 'bg-blue-600 text-white'
                  : step.id < currentStep
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-[#1c1c26] text-[#5a5a72]'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.id < currentStep ? 'bg-green-500 text-white' :
                  step.id === currentStep ? 'bg-white text-blue-600' :
                  'bg-[#2a2a38] text-[#5a5a72]'
                }`}>{step.id < currentStep ? '✓' : step.id}</span>
                {step.label}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-px ${step.id < currentStep ? 'bg-green-500/40' : 'bg-[#2a2a38]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {!currentStep && <div className="flex-1" />}

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-1.5 text-[#5a5a72] hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
            AR
          </div>
          <span className="text-sm text-[#aaaacc] font-medium">Alex R.</span>
          <ChevronDown size={14} className="text-[#5a5a72]" />
        </div>
      </div>
    </header>
  )
}
