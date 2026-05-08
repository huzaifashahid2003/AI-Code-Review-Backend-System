import React, { useState, useEffect } from 'react'
import { File, CheckCircle, Loader2, Copy, CopyCheck } from 'lucide-react'

// Parse a unified diff patch into typed line objects
function parsePatch(patch) {
  if (!patch) return []
  return patch.split('\n').map(line => {
    if (line.startsWith('@@')) return { type: 'hunk', text: line }
    if (line.startsWith('-'))  return { type: 'removed', text: line.slice(1) }
    if (line.startsWith('+'))  return { type: 'added',   text: line.slice(1) }
    return { type: 'context', text: line.startsWith(' ') ? line.slice(1) : line }
  })
}

// One comment card per function in a file's analysis
function flattenComments(analysis = []) {
  return analysis.map((item, idx) => ({
    id: idx,
    function:     item.function || 'unknown',
    code:         item.code || '',
    suggestion:   item.fixed_code || item.code || '',   // backend field is fixed_code
    severity:     item.review?.severity || 'low',
    issues:       item.review?.issues || [],
    improvements: item.review?.improvements || [],
  }))
}

function SeverityBadge({ severity }) {
  const cls =
    severity === 'high'   ? 'bg-red-500/15 border-red-500/30 text-red-400' :
    severity === 'medium' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                            'bg-blue-500/15 border-blue-500/30 text-blue-400'
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
      {severity}
    </span>
  )
}

export default function PRReview({ pr }) {
  const repo     = pr?.repo
  const prNumber = pr?.id

  const [reviews,         setReviews]         = useState([])
  const [diffFiles,       setDiffFiles]       = useState([])
  const [selectedFile,    setSelectedFile]    = useState(null)
  const [selectedComment, setSelectedComment] = useState(null)
  const [appliedFixes, setAppliedFixes] = useState([])
  const [copiedKeys,   setCopiedKeys]   = useState([])
  const [diffLoading,     setDiffLoading]     = useState(false)
  const [reviewLoading,   setReviewLoading]   = useState(false)
  const [error,           setError]           = useState(null)

  useEffect(() => {
    if (!repo || !prNumber) return

    // Reset
    setError(null)
    setReviews([])
    setDiffFiles([])
    setSelectedFile(null)
    setSelectedComment(null)
    setAppliedFixes([])

    // ── Fetch diff immediately (fast) ────────────────────────────────────
    setDiffLoading(true)
    fetch(`http://localhost:8000/pr-diff?repo=${encodeURIComponent(repo)}&pr_number=${prNumber}`)
      .then(r => r.json())
      .then(data => {
        const dif = data.diff || []
        setDiffFiles(dif)
        if (dif.length > 0) setSelectedFile(dif[0].filename)
      })
      .catch(err => setError(err.message))
      .finally(() => setDiffLoading(false))

    // ── Fetch review separately (slow — AI analysis) ─────────────────────
    setReviewLoading(true)
    fetch(`http://localhost:8000/pr-review?repo=${encodeURIComponent(repo)}&pr_number=${prNumber}`)
      .then(r => r.json())
      .then(data => {
        const rev = data.reviews || []
        setReviews(rev)
        if (rev.length > 0) {
          setSelectedFile(rev[0].file)
          const cmts = flattenComments(rev[0].analysis)
          setSelectedComment(cmts.length > 0 ? cmts[0] : null)
        }
      })
      .catch(err => console.error('PR review fetch failed:', err))
      .finally(() => setReviewLoading(false))
  }, [repo, prNumber])

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fileReview = reviews.find(r => r.file === selectedFile) ?? null
  const comments   = flattenComments(fileReview?.analysis)

  const fileDiff = diffFiles.find(d =>
    d.filename === selectedFile ||
    d.filename.endsWith('/' + selectedFile) ||
    (selectedFile && selectedFile.endsWith('/' + d.filename))
  )
  const parsedPatch = parsePatch(fileDiff?.patch)

  // Counts across the entire PR
  const allComments  = reviews.flatMap(r => flattenComments(r.analysis))
  const highCount    = allComments.filter(c => c.severity === 'high').length
  const mediumCount  = allComments.filter(c => c.severity === 'medium').length
  const lowCount     = allComments.filter(c => c.severity === 'low').length

  const selectFile = (filename) => {
    setSelectedFile(filename)
    const rev  = reviews.find(r => r.file === filename)
    const cmts = flattenComments(rev?.analysis)
    setSelectedComment(cmts.length > 0 ? cmts[0] : null)
  }

  const toggleComment = (comment) =>
    setSelectedComment(prev => prev?.id === comment.id && prev?.function === comment.function ? null : comment)

  // â”€â”€ Early returns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!repo || !prNumber) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <p className="text-sm text-[#5a5a72]">Select a PR to review.</p>
      </div>
    )
  }

  if (diffLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
          <p className="text-sm text-[#5a5a72]">Loading diff…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    )
  }

  // Always show the real git patch from GitHub in the center diff panel

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* â”€â”€ LEFT: File tree â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-52 flex-shrink-0 border-r border-[#2a2a38] bg-[#0d0d12] flex flex-col">
        <div className="px-3 py-2.5 border-b border-[#2a2a38]">
          <h3 className="text-xs font-semibold text-[#5a5a72] uppercase tracking-wide">Files Changed</h3>
          {pr && <p className="text-xs text-white mt-0.5 truncate">PR #{pr.id}: {pr.title}</p>}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {reviews.map((fileRev) => {
            const cmts       = flattenComments(fileRev.analysis)
            const issueCount = cmts.reduce((n, c) => n + c.issues.length, 0)
            const isActive   = selectedFile === fileRev.file
            return (
              <button
                key={fileRev.file}
                onClick={() => selectFile(fileRev.file)}
                className={`w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#111117] text-left transition-colors ${isActive ? 'bg-[#1c1c26]' : ''}`}
              >
                <File size={12} className={issueCount > 0 ? 'text-yellow-400' : 'text-[#3a3a4e]'} />
                <span className={`text-xs flex-1 truncate ${isActive ? 'text-white' : 'text-[#5a5a72]'}`}>{fileRev.file}</span>
                {issueCount > 0 && (
                  <span className="text-[9px] px-1 bg-yellow-500/20 text-yellow-400 rounded">{issueCount}</span>
                )}
              </button>
            )
          })}
          {reviews.length === 0 && (
            <p className="text-xs text-[#5a5a72] text-center pt-6 px-3">No Python files found in this PR.</p>
          )}
        </div>
      </div>

      {/* â”€â”€ CENTER: Diff viewer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#2a2a38]">
        <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-[#111117] flex items-center gap-2">
          <File size={13} className="text-blue-400" />
          <span className="text-xs font-medium text-white">{selectedFile || 'â€”'}</span>
          {fileDiff && (
            <span className="text-xs text-[#5a5a72] ml-auto font-mono">git diff</span>
          )}
        </div>
        <div className="flex flex-1 overflow-hidden">

          {/* Before panel — shows the NEW code from the PR (added lines) */}
          <div className="flex-1 flex flex-col border-r border-[#2a2a38] overflow-hidden">
            <div className="px-3 py-1.5 bg-green-500/10 border-b border-green-500/20">
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">Before</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="p-4 text-[11px] leading-5 font-mono whitespace-pre-wrap break-all">
                {parsedPatch
                  .filter(l => l.type !== 'removed')
                  .map((l, i) => (
                    <span key={i} className={
                      l.type === 'added' ? 'text-green-300 block' :
                      l.type === 'hunk'  ? 'text-[#5a5a72] block' :
                                           'text-[#8888a8] block'
                    }>
                      {l.type === 'added' ? '+ ' : '  '}{l.text}
                    </span>
                  ))
                }
              </pre>
            </div>
          </div>

          {/* After panel — shows the ORIGINAL code (removed lines) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">After</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <pre className="p-4 text-[11px] leading-5 font-mono whitespace-pre-wrap break-all">
                {parsedPatch
                  .filter(l => l.type !== 'added')
                  .map((l, i) => (
                    <span key={i} className={
                      l.type === 'removed' ? 'text-red-300 block' :
                      l.type === 'hunk'    ? 'text-[#5a5a72] block' :
                                             'text-[#8888a8] block'
                    }>
                      {l.type === 'removed' ? '- ' : '  '}{l.text}
                    </span>
                  ))
                }
              </pre>
            </div>
          </div>

        </div>
      </div>

      {/* â”€â”€ RIGHT: AI Comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-72 flex-shrink-0 bg-[#0d0d12] flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-[#111117]">
          <h3 className="text-sm font-semibold text-white">AI Comments</h3>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-red-400">{highCount}</p>
              <p className="text-[9px] text-[#5a5a72]">High</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-yellow-400">{mediumCount}</p>
              <p className="text-[9px] text-[#5a5a72]">Medium</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1.5">
              <p className="text-sm font-bold text-blue-400">{lowCount}</p>
              <p className="text-[9px] text-[#5a5a72]">Low</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {reviewLoading && (
            <div className="flex flex-col items-center gap-2 pt-8">
              <Loader2 size={22} className="text-blue-400 animate-spin" />
              <p className="text-[11px] text-[#5a5a72] text-center">Running AI analysis…<br/>This may take a minute.</p>
            </div>
          )}
          {!reviewLoading && comments.map((comment) => {
            const isSelected = selectedComment?.id === comment.id && selectedComment?.function === comment.function
            const cardCls =
              comment.severity === 'high'   ? 'bg-red-500/8 border-red-500/25' :
              comment.severity === 'medium' ? 'bg-yellow-500/8 border-yellow-500/25' :
                                              'bg-blue-500/8 border-blue-500/25'
            return (
              <div
                key={`${comment.id}-${comment.function}`}
                onClick={() => toggleComment(comment)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${cardCls} ${isSelected ? 'ring-1 ring-white/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <SeverityBadge severity={comment.severity} />
                  <span className="text-[10px] text-[#5a5a72] font-mono truncate ml-2 max-w-[120px]">{comment.function}</span>
                </div>

                {comment.issues.map((issue, i) => (
                  <p key={i} className="text-[#aaaacc] leading-relaxed mb-1">{issue}</p>
                ))}

                {comment.improvements.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {comment.improvements.map((imp, i) => (
                      <p key={i} className="text-[#7a7a9a] leading-relaxed text-[10px]">{imp}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5 mt-2">
                  {copiedKeys.includes(`${comment.id}-${comment.function}`) ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <CopyCheck size={10} /> Copied!
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(comment.suggestion || comment.code)
                        const key = `${comment.id}-${comment.function}`
                        setCopiedKeys(k => [...k, key])
                        setTimeout(() => setCopiedKeys(k => k.filter(x => x !== key)), 2000)
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded text-[10px] hover:bg-blue-600/30 transition-colors"
                    >
                      <Copy size={9} /> Copy Correct Code
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {!reviewLoading && comments.length === 0 && (
            <p className="text-xs text-[#5a5a72] text-center pt-6">No issues found for this file.</p>
          )}
        </div>
      </div>

    </div>
  )
}
