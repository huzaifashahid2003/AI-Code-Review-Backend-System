import React, { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, CheckCircle, AlertTriangle, ShieldAlert, X, Copy, Check } from 'lucide-react'

const FILE_TREE = [
  { name: 'data', type: 'folder', children: [
    { name: '_validateUser', type: 'file', issues: 0 },
    { name: 'auth.py', type: 'file', issues: 3 },
  ]},
  { name: 'format', type: 'folder', children: [
    { name: 'auth.py', type: 'file', issues: 2 },
  ]},
  { name: 'diff', type: 'folder', children: [
    { name: 'auth.py', type: 'file', issues: 1, active: true },
    { name: 'inlex.py', type: 'file', issues: 0 },
    { name: 'auth.py', type: 'file', issues: 0 },
  ]},
  { name: 'reviews', type: 'folder', children: [] },
  { name: 'ratings', type: 'folder', children: [] },
]



const AI_COMMENTS = [
  {
    id: 1, line: 'L7', severity: 'high',
    message: 'Replace `reset()` with `fetch_list()` — `reset()` clears the entire dataset which causes data loss.',
    code: `def load_data(data_count):
    aaab = a * acc01
    data_count = reset(), (data_count)
    arg = (data_count)
    value = calculate_mean()
    return data_vaunt`,
    suggestion: `def load_data(data_count):
    aaab = a * acc01
    data_count = fetch_list(data_count)
    arg = (data_count)
    value = calculate_mean()
    return data_vaunt`,
  },
  {
    id: 2, line: 'L10–11', severity: 'medium',
    message: 'Potential off-by-one error in loop bounds. Index starts at 1 but array is 0-indexed.',
    code: `def process_items(data_count):
    total = 0
    for i in range(1, len(data_count)):
        total += data_count[i]
    return total`,
    suggestion: `def process_items(data_count):
    total = 0
    for i in range(len(data_count)):
        total += data_count[i]
    return total`,
  },
  {
    id: 3, line: 'L17', severity: 'medium',
    message: '`recerfett` is not defined in scope. Did you mean `recerfetch`?',
    code: `def calculateTost():
    avg in recerfett:
        pass`,
    suggestion: `def calculateTost():
    return aoclist(count(data_count))`,
  },
]

export default function PRReview({ pr }) {
  const [expandedFolders, setExpandedFolders] = useState({ data: true, diff: true })
  const [appliedFixes, setAppliedFixes] = useState([])
  const [copied, setCopied] = useState(null)
  const [selectedComment, setSelectedComment] = useState(AI_COMMENTS[0])

  const toggleFolder = (name) => setExpandedFolders(f => ({ ...f, [name]: !f[name] }))

  const applyFix = (id) => setAppliedFixes(a => [...a, id])

  const copy = (id, text) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* LEFT: File tree */}
      <div className="w-52 flex-shrink-0 border-r border-[#2a2a38] bg-[#0d0d12] flex flex-col">
        <div className="px-3 py-2.5 border-b border-[#2a2a38]">
          <h3 className="text-xs font-semibold text-[#5a5a72] uppercase tracking-wide">File Tree</h3>
          {pr && <p className="text-xs text-white mt-0.5 truncate">PR #{pr.id}: {pr.title}</p>}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {FILE_TREE.map((item) => (
            <div key={item.name}>
              <button
                onClick={() => item.type === 'folder' && toggleFolder(item.name)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#111117] text-left transition-colors"
              >
                {item.type === 'folder' ? (
                  expandedFolders[item.name] ? <ChevronDown size={11} className="text-[#5a5a72]" /> : <ChevronRight size={11} className="text-[#5a5a72]" />
                ) : <span className="w-3" />}
                {item.type === 'folder' ? (
                  <Folder size={12} className="text-blue-400 flex-shrink-0" />
                ) : (
                  <File size={12} className="text-[#5a5a72] flex-shrink-0" />
                )}
                <span className={`text-xs truncate ${item.active ? 'text-white' : 'text-[#8888a8]'}`}>{item.name}</span>
              </button>
              {item.type === 'folder' && expandedFolders[item.name] && item.children?.map((child, ci) => (
                <button
                  key={ci}
                  className={`w-full flex items-center gap-1.5 pl-7 pr-3 py-1.5 hover:bg-[#111117] text-left transition-colors ${child.active ? 'bg-[#1c1c26]' : ''}`}
                >
                  <File size={11} className={child.issues > 0 ? 'text-yellow-400' : 'text-[#3a3a4e]'} />
                  <span className={`text-xs flex-1 truncate ${child.active ? 'text-white' : 'text-[#5a5a72]'}`}>{child.name}</span>
                  {child.issues > 0 && (
                    <span className="text-[9px] px-1 bg-yellow-500/20 text-yellow-400 rounded">{child.issues}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Before/After diff viewer */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#2a2a38]">
        <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-[#111117] flex items-center gap-2">
          <File size={13} className="text-blue-400" />
          <span className="text-xs font-medium text-white">auth.py</span>
          {selectedComment && (
            <span className="text-xs text-[#5a5a72] ml-auto font-mono">{selectedComment.line}</span>
          )}
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Before panel */}
          <div className="flex-1 flex flex-col border-r border-[#2a2a38] overflow-hidden">
            <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Before</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="code-block p-4 text-[11px] leading-5 text-red-300 font-mono whitespace-pre-wrap break-all">
                {selectedComment ? selectedComment.code : ''}
              </pre>
            </div>
          </div>
          {/* After panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 bg-green-500/10 border-b border-green-500/20">
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">After</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="code-block p-4 text-[11px] leading-5 text-green-300 font-mono whitespace-pre-wrap break-all">
                {selectedComment ? selectedComment.suggestion : ''}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: AI Comments */}
      <div className="w-72 flex-shrink-0 bg-[#0d0d12] flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-[#111117]">
          <h3 className="text-sm font-semibold text-white">AI Comments</h3>
          {/* Summary */}
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-red-400">3</p>
              <p className="text-[9px] text-[#5a5a72]">High</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-yellow-400">15</p>
              <p className="text-[9px] text-[#5a5a72]">Medium</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-blue-400">22</p>
              <p className="text-[9px] text-[#5a5a72]">Low</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {AI_COMMENTS.map((comment) => (
            <div
              key={comment.id}
              onClick={() => setSelectedComment(comment)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedComment?.id === comment.id ? 'ring-1 ring-white/20 ' : ''
              }${
                comment.severity === 'high' ? 'bg-red-500/8 border-red-500/25' :
                comment.severity === 'medium' ? 'bg-yellow-500/8 border-yellow-500/25' :
                'bg-blue-500/8 border-blue-500/25'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  comment.severity === 'high' ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                  comment.severity === 'medium' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                  'bg-blue-500/15 border-blue-500/30 text-blue-400'
                }`}>{comment.severity}</span>
                <span className="text-[10px] text-[#5a5a72] font-mono">{comment.line}</span>
              </div>
              <p className="text-[#aaaacc] leading-relaxed mb-2">{comment.message}</p>
              {comment.suggestion && (
                <div className="bg-[#111117] rounded p-2 font-mono text-[10px] text-green-300 mb-2">
                  {comment.suggestion}
                </div>
              )}
              <div className="flex gap-1.5">
                {appliedFixes.includes(comment.id) ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <CheckCircle size={10} /> Applied
                  </span>
                ) : (
                  <button
                    onClick={() => applyFix(comment.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-400 rounded text-[10px] hover:bg-green-600/30 transition-colors"
                  >
                    Apply Change
                  </button>
                )}
                <button
                  onClick={() => copy(comment.id, comment.suggestion)}
                  className="flex items-center gap-1 px-2 py-1 bg-[#1c1c26] border border-[#2a2a38] text-[#5a5a72] hover:text-white rounded text-[10px] transition-colors"
                >
                  {copied === comment.id ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
