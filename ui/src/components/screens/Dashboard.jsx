import React from 'react'
import {
  FileCode, AlertTriangle, ShieldAlert, GitPullRequest,
  Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Activity, Upload
} from 'lucide-react'

export default function Dashboard({ stats, onStartAnalysis }) {
  const { filesAnalyzed, issuesFound, highSeverity, activity, criticalIssues } = stats
  const hasData = filesAnalyzed > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Main Dashboard</h1>
          <p className="text-sm text-[#5a5a72] mt-0.5">AI-powered code review overview</p>
        </div>
        <button
          onClick={onStartAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Start New Analysis
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Files Analyzed"
          value={hasData ? filesAnalyzed.toLocaleString() : '—'}
          sub={hasData ? `from ${activity.length} session${activity.length !== 1 ? 's' : ''}` : 'No files yet'}
          subColor={hasData ? 'text-green-400' : 'text-[#5a5a72]'}
          icon={<FileCode size={20} className="text-blue-400" />}
          accent="border-blue-500/20"
        />
        <MetricCard
          label="Issues Found"
          value={hasData ? issuesFound.toLocaleString() : '—'}
          sub={hasData ? `across ${filesAnalyzed} file${filesAnalyzed !== 1 ? 's' : ''}` : 'Upload code to begin'}
          subColor={hasData ? 'text-yellow-400' : 'text-[#5a5a72]'}
          icon={<AlertTriangle size={20} className="text-yellow-400" />}
          accent="border-yellow-500/20"
        />
        <MetricCard
          label="High Severity"
          value={hasData ? highSeverity.toLocaleString() : '—'}
          sub={hasData ? (highSeverity > 0 ? 'Requires attention' : 'None found') : 'No data yet'}
          subColor={hasData && highSeverity > 0 ? 'text-red-400' : 'text-[#5a5a72]'}
          icon={<ShieldAlert size={20} className="text-red-400" />}
          accent="border-red-500/20"
        />
        <MetricCard
          label="Open PRs Reviewed"
          value="—"
          sub="GitHub integration"
          subColor="text-[#5a5a72]"
          icon={<GitPullRequest size={20} className="text-purple-400" />}
          accent="border-purple-500/20"
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#111117] border border-[#2a2a38] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={15} className="text-blue-400" />
              Recent Activity
            </h2>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-2.5">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  {item.status === 'success' ? (
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#ccccdd] truncate">Analyzed file: {item.file}</p>
                    <p className="text-[10px] text-[#5a5a72] mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Upload size={28} className="text-[#3a3a4e] mb-2" />
              <p className="text-xs text-[#5a5a72]">No activity yet</p>
              <p className="text-[10px] text-[#3a3a4e] mt-1">Upload and analyze a file to see activity</p>
            </div>
          )}
        </div>

        {/* Critical Issues */}
        <div className="bg-[#111117] border border-[#2a2a38] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-400" />
              Critical Issues
            </h2>
          </div>
          {criticalIssues.length > 0 ? (
            <div className="space-y-2.5">
              {criticalIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-red-500/5 border border-red-500/15 rounded-lg">
                  <XCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#ccccdd]">{issue.label}</p>
                    {issue.detail && <p className="text-[10px] text-[#5a5a72] mt-0.5">{issue.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {hasData ? (
                <>
                  <CheckCircle size={28} className="text-green-400 mb-2" />
                  <p className="text-xs text-[#5a5a72]">No critical issues found</p>
                </>
              ) : (
                <>
                  <ShieldAlert size={28} className="text-[#3a3a4e] mb-2" />
                  <p className="text-xs text-[#5a5a72]">No data yet</p>
                  <p className="text-[10px] text-[#3a3a4e] mt-1">Critical issues will appear here after analysis</p>
                </>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-[#2a2a38] space-y-2">
            <button
              onClick={onStartAnalysis}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Analyze New Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, subColor, icon, accent }) {
  return (
    <div className={`bg-[#111117] border ${accent} rounded-xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#5a5a72] font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1.5">{value}</p>
          <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
        </div>
        <div className="p-2 bg-[#1c1c26] rounded-lg">{icon}</div>
      </div>
    </div>
  )
}
