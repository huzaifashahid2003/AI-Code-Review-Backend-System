import React, { useState } from 'react'
import { Copy, Download, CheckCircle, ArrowRight, Info, ArrowLeft } from 'lucide-react'

export default function FixStep({ issue, onBack, onRerun }) {
  const [applied, setApplied] = useState(false)
  const [copied, setCopied] = useState(null)

  const copy = (key, text) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  // issue is now a full function object: { function, code, line, file, review: { issues, improvements, severity } }
  const funcName    = issue?.function || ''
  const beforeCode  = issue?.code || ''
  const afterCode   = issue?.fixed_code || ''
  const improvements = (issue?.review?.improvements || [])
  const issuesList  = (issue?.review?.issues || [])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c26] border border-[#2a2a38] text-[#8888a8] hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Review
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Apply Fix</h1>
            <p className="text-sm text-[#5a5a72] mt-0.5">
              {issue ? `${funcName} — ${issue.file || ''}` : 'Review and apply the suggested code change'}
            </p>
          </div>
        </div>
        {applied && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/15 border border-green-500/30 rounded-lg">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs font-medium text-green-400">Fix applied successfully</span>
          </div>
        )}
      </div>

      {/* Issues & Improvements */}
      {issue && (
        <div className="space-y-2">
          {issuesList.length > 0 && (
            <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-xs font-semibold text-red-400 mb-1">Issues Detected</p>
              <ul className="space-y-1">
                {issuesList.map((iss, i) => (
                  <li key={i} className="text-sm text-[#ccccdd] flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0">–</span>
                    {typeof iss === 'string' ? iss : iss?.message || String(iss)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-1">AI Suggested Improvements</p>
                <ul className="space-y-1">
                  {improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-[#aaaacc] flex items-start gap-2">
                      <span className="text-green-400 flex-shrink-0">+</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diff view */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before */}
        <div className="bg-[#0d0d12] border border-[#2a2a38] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-red-500/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-400">Before</span>
            {issue?.file && <span className="text-xs text-[#5a5a72] ml-auto">{issue.file}</span>}
          </div>
          <pre className="code-block p-4 text-red-300 overflow-x-auto text-xs leading-5">
            <code>{beforeCode || 'No original code available'}</code>
          </pre>
        </div>

        {/* After */}
        <div className="bg-[#0d0d12] border border-[#2a2a38] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a2a38] bg-green-500/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-400">After</span>
            {issue?.file && <span className="text-xs text-[#5a5a72] ml-auto">{issue.file}</span>}
          </div>
          <pre className="code-block p-4 text-green-300 overflow-x-auto text-xs leading-5">
            <code>{afterCode || 'No suggestion available'}</code>
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setApplied(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            applied
              ? 'bg-green-600/20 border border-green-500/30 text-green-400 cursor-default'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          <CheckCircle size={15} />
          {applied ? 'Fix Applied' : 'Apply Fix to Code'}
        </button>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c26] border border-[#2a2a38] text-[#aaaacc] hover:text-white rounded-lg text-sm font-medium transition-colors">
          <Download size={15} />
          Download Corrected File (.py)
        </button>

        <button
          onClick={() => copy('fixed', afterCode)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c26] border border-[#2a2a38] text-[#aaaacc] hover:text-white rounded-lg text-sm font-medium transition-colors"
        >
          {copied === 'fixed' ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} />}
          {copied === 'fixed' ? 'Copied!' : 'Copy Fixed Code'}
        </button>
      </div>

      {/* Continue */}
      {applied && (
        <div className="pt-2">
          <button
            onClick={onRerun}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Continue to Re-run Analysis
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
