import React, { useState, useEffect } from 'react'
import { Github, RefreshCw, GitPullRequest, CheckCircle, Clock, AlertCircle, ChevronRight, Loader } from 'lucide-react'

const statusMeta = {
  reviewed:  { label: 'Reviewed',          color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',  icon: CheckCircle },
  analyzing: { label: 'Analysing…',         color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30',    icon: RefreshCw   },
  pending:   { label: 'Pending AI Review',  color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: Clock       },
}

export default function GithubIntegration({ onOpenPR }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:8000/github/status')
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const connected = data?.connected ?? false
  const repos = data?.repos ?? []
  const prs = data?.prs ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">GitHub Integration</h1>
          {data?.login && <p className="text-xs text-[#5a5a72] mt-0.5">Signed in as <span className="text-blue-400">@{data.login}</span></p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c26] border border-[#2a2a38] text-[#8888a8] hover:text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/15 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-green-400">Connected to GitHub</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c26] border border-[#2a2a38] rounded-lg">
              <Github size={14} className="text-[#5a5a72]" />
              <span className="text-xs font-medium text-[#5a5a72]">Not connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Token not set */}
      {!loading && !connected && (
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-sm text-yellow-300">
          No GitHub token found. Add <code className="bg-[#1c1c26] px-1 rounded">Github_token</code> to your <code className="bg-[#1c1c26] px-1 rounded">.env</code> file and restart the backend.
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#5a5a72]">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm">Loading GitHub data…</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Repositories */}
          <div className="col-span-1 bg-[#111117] border border-[#2a2a38] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a38] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Repositories</h2>
              <span className="text-xs text-[#5a5a72]">{repos.length} repos</span>
            </div>
            {repos.length > 0 ? (
              <div className="divide-y divide-[#1c1c26]">
                {repos.map((repo) => (
                  <div key={repo.full_name} className="px-4 py-3 hover:bg-[#1c1c26] cursor-pointer transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium truncate">{repo.name}</span>
                      <span className="text-[10px] font-medium text-green-400 ml-2 flex-shrink-0">
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#5a5a72]">
                      <span>Branch: {repo.branch}</span>
                      <span>·</span>
                      <span>Updated {repo.lastSync}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Github size={28} className="text-[#3a3a4e] mb-2" />
                <p className="text-xs text-[#5a5a72]">No repositories found</p>
              </div>
            )}
          </div>

          {/* Pull Requests */}
          <div className="col-span-2 bg-[#111117] border border-[#2a2a38] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a38] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitPullRequest size={15} className="text-purple-400" />
                Open Pull Requests
              </h2>
              <span className="text-xs text-[#5a5a72]">{prs.length} PRs</span>
            </div>
            {prs.length > 0 ? (
              <div className="divide-y divide-[#1c1c26]">
                {prs.map((pr) => {
                  const meta = statusMeta[pr.status] || statusMeta.pending
                  const StatusIcon = meta.icon
                  return (
                    <div key={`${pr.repo}-${pr.id}`} className="px-4 py-3 hover:bg-[#1c1c26] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">PR #{pr.id}: {pr.title}</span>
                            <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${meta.bg} ${meta.color} flex-shrink-0`}>
                              <StatusIcon size={10} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#5a5a72]">
                            <span>{pr.repo}</span>
                            <span>·</span>
                            <span>{pr.branch}</span>
                            <span>·</span>
                            <span>Updated {pr.updated}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenPR(pr)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                        >
                          Run AI Review
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <GitPullRequest size={32} className="text-[#3a3a4e] mb-3" />
                <p className="text-sm text-[#5a5a72]">No open pull requests</p>
                <p className="text-xs text-[#3a3a4e] mt-1">Open PRs from your connected repositories will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

