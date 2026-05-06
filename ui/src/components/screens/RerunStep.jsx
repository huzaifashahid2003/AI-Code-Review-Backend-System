import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingDown, CheckCircle, ShieldAlert, AlertTriangle, Info, ArrowRight } from 'lucide-react'

export default function RerunStep({ onGoToDashboard }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)

  const startRerun = () => {
    setAnalyzing(true)
    setDone(false)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setAnalyzing(false)
          setDone(true)
          return 100
        }
        return p + 2
      })
    }, 40)
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Re-run Analysis</h1>
        <p className="text-sm text-[#5a5a72] mt-0.5">Verify fixes and check for remaining issues</p>
      </div>

      {!done && !analyzing && (
        <div className="p-8 bg-[#111117] border border-[#2a2a38] rounded-xl text-center">
          <RefreshCw size={40} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">Ready to Re-analyze</h3>
          <p className="text-sm text-[#5a5a72] mb-6">
            1 fix was applied. Re-run the analysis to confirm the changes resolved the issues.
          </p>
          <button
            onClick={startRerun}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
          >
            <RefreshCw size={15} />
            Re-analyze Code
          </button>
        </div>
      )}

      {analyzing && (
        <div className="p-6 bg-[#111117] border border-[#2a2a38] rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw size={18} className="text-blue-400 animate-spin" />
            <span className="text-sm font-medium text-white">Re-analyzing…</span>
            <span className="text-xs text-[#5a5a72] ml-auto">{Math.round(progress)}%</span>
          </div>
          <div className="bg-[#1c1c26] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-100 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {done && (
        <>
          {/* Improvement banner */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <TrendingDown size={20} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-400">Issues Reduced!</p>
              <p className="text-xs text-[#5a5a72] mt-0.5">Fixed 1 high-severity issue. Code quality score improved from 62 → 74.</p>
            </div>
          </div>

          {/* Before vs After */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#111117] border border-[#2a2a38] rounded-xl">
              <p className="text-xs text-[#5a5a72] mb-3 font-medium">Before Fixes</p>
              <div className="space-y-2">
                <IssueCount icon={<ShieldAlert size={14} />} color="text-red-400" count={2} label="High" />
                <IssueCount icon={<AlertTriangle size={14} />} color="text-yellow-400" count={3} label="Medium" />
                <IssueCount icon={<Info size={14} />} color="text-blue-400" count={1} label="Low" />
              </div>
              <div className="mt-3 pt-3 border-t border-[#2a2a38]">
                <p className="text-xs text-[#5a5a72]">Score: <span className="text-white font-semibold">62</span></p>
              </div>
            </div>
            <div className="p-4 bg-[#111117] border border-green-500/20 rounded-xl">
              <p className="text-xs text-green-400 mb-3 font-medium">After Fixes</p>
              <div className="space-y-2">
                <IssueCount icon={<ShieldAlert size={14} />} color="text-red-400" count={1} label="High" sub="▼1" />
                <IssueCount icon={<AlertTriangle size={14} />} color="text-yellow-400" count={3} label="Medium" />
                <IssueCount icon={<Info size={14} />} color="text-blue-400" count={1} label="Low" />
              </div>
              <div className="mt-3 pt-3 border-t border-[#2a2a38]">
                <p className="text-xs text-[#5a5a72]">Score: <span className="text-green-400 font-semibold">74</span> <span className="text-green-500 text-[10px]">+12</span></p>
              </div>
            </div>
          </div>

          {/* Remaining issues */}
          <div className="bg-[#111117] border border-[#2a2a38] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Remaining Issues</h3>
            <div className="space-y-2">
              {[
                { fn: 'aoo_mac', issue: 'SQL Injection Vulnerability', sev: 'high' },
                { fn: 'validate_user', issue: 'Unused Local Variable', sev: 'medium' },
                { fn: 'process_data', issue: 'Missing Input Validation', sev: 'medium' },
                { fn: 'calculate_user', issue: 'Bare Except Clause', sev: 'medium' },
                { fn: 'name_onser', issue: 'Function Too Long', sev: 'low' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1c1c26] last:border-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    item.sev === 'high' ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                    item.sev === 'medium' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                    'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  }`}>{item.sev}</span>
                  <span className="text-xs font-mono text-[#8888a8]">{item.fn}</span>
                  <span className="text-xs text-[#5a5a72]">{item.issue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToDashboard}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to Dashboard
              <ArrowRight size={15} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c26] border border-[#2a2a38] text-[#aaaacc] hover:text-white rounded-lg text-sm font-medium transition-colors">
              Continue Fixing Issues
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function IssueCount({ icon, color, count, label, sub }) {
  return (
    <div className="flex items-center gap-2">
      <span className={color}>{icon}</span>
      <span className="text-xs text-[#aaaacc] flex-1">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{count}</span>
      {sub && <span className="text-[10px] text-green-400">{sub}</span>}
    </div>
  )
}
