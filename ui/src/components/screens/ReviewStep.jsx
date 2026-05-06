import React, { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, Info, CheckCircle, Copy, Wrench, ChevronDown, ChevronRight } from 'lucide-react'

const VALID_SEVERITIES = new Set(['high', 'medium', 'low'])

function normalizeSeverity(raw) {
  const s = (raw || '').toLowerCase().trim()
  return VALID_SEVERITIES.has(s) ? s : 'low'
}

// LLM may return issues as strings OR as objects like {line, message}
function extractText(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    return [item.message, item.line ? `(line ${item.line})` : ''].filter(Boolean).join(' ')
  }
  return String(item)
}

const SEVERITY_META = {
  high:   { label: 'High',   color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       icon: ShieldAlert },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: AlertTriangle },
  low:    { label: 'Low',    color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30',     icon: Info },
}

const getSeverityMeta = (severity) => SEVERITY_META[normalizeSeverity(severity)] || SEVERITY_META['low']

// Flatten results (one per file) into a flat array of function objects, each carrying its file name
function flattenFunctions(results) {
  if (!results || results.length === 0) return []
  const funcs = []
  for (const fileResult of results) {
    if (!fileResult || fileResult.error) continue
    for (const funcResult of (fileResult.analysis || [])) {
      funcs.push({ ...funcResult, file: fileResult.filename })
    }
  }
  return funcs
}

export default function ReviewStep({ results, onApplyFix }) {
  const [functions, setFunctions] = useState([])
  const [selectedFunction, setSelectedFunction] = useState(null)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const funcs = flattenFunctions(results)
    setFunctions(funcs)
    setSelectedFunction(funcs.length > 0 ? funcs[0] : null)
  }, [results])

  const copy = (text, key) => {
    navigator.clipboard.writeText(text || '').catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  // Empty / error state
  if (!results || results.length === 0 || functions.length === 0) {
    const hasError = results && results.some(r => r && r.error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
        <h3 className="text-lg font-semibold text-white">
          {hasError ? 'Analysis Completed with Errors' : 'No Issues Found'}
        </h3>
        <p className="text-sm text-[#5a5a72] mt-1">
          {hasError
            ? 'Some files could not be analyzed. Check that your Groq API key is set in a .env file.'
            : 'Great news — no reviewable issues were detected in your code.'}
        </p>
      </div>
    )
  }

  const highCount = functions.filter(f => normalizeSeverity(f.review?.severity) === 'high').length
  const medCount  = functions.filter(f => normalizeSeverity(f.review?.severity) === 'medium').length
  const lowCount  = functions.filter(f => normalizeSeverity(f.review?.severity) === 'low').length

  const issues       = (selectedFunction?.review?.issues       || []).map(extractText).filter(Boolean)
  const improvements = (selectedFunction?.review?.improvements || []).map(extractText).filter(Boolean)
  const fixedCode    = selectedFunction?.fixed_code || ''
  const meta         = getSeverityMeta(selectedFunction?.review?.severity)

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* LEFT: Function list */}
      <div className="w-64 flex-shrink-0 border-r border-[#2a2a38] bg-[#0d0d12] flex flex-col">
        <div className="px-4 py-3 border-b border-[#2a2a38]">
          <h2 className="text-sm font-semibold text-white">Function List</h2>
          <div className="flex items-center gap-2 mt-2">
            {highCount > 0 && <span className="text-xs px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full">{highCount} High</span>}
            {medCount  > 0 && <span className="text-xs px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-full">{medCount} Med</span>}
            {lowCount  > 0 && <span className="text-xs px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-full">{lowCount} Low</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {functions.map((func, index) => {
            const fMeta = getSeverityMeta(func.review?.severity)
            const isActive = selectedFunction?.function === func.function && selectedFunction?.file === func.file
            return (
              <button
                key={index}
                onClick={() => setSelectedFunction(func)}
                className={`w-full text-left px-4 py-3 border-l-2 transition-all ${
                  isActive
                    ? 'bg-[#1c1c26] border-blue-500'
                    : 'border-transparent hover:bg-[#111117]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-[#aaaacc] truncate">{func.function}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${fMeta.bg} ${fMeta.color} ml-1 flex-shrink-0`}>
                    {fMeta.label}
                  </span>
                </div>
                {func.line && <p className="text-[11px] text-[#5a5a72]">Line {func.line}</p>}
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT: Detail panel */}
      {selectedFunction ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Function header */}
          <div className={`p-4 rounded-xl border ${meta.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                {meta.label} Severity
              </span>
              {selectedFunction.line && (
                <span className="text-xs text-[#5a5a72]">Line {selectedFunction.line}</span>
              )}
              {selectedFunction.file && (
                <span className="text-xs text-[#5a5a72] font-mono ml-auto">{selectedFunction.file}</span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white font-mono">{selectedFunction.function}</h3>
          </div>

          {/* Before: original code */}
          {selectedFunction.code && (
            <div className="bg-[#0d0d12] border border-[#2a2a38] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a38] bg-[#111117]">
                <span className="text-xs font-medium text-red-400">Before — Original Code</span>
                <button
                  onClick={() => copy(selectedFunction.code, 'code')}
                  className="flex items-center gap-1.5 text-xs text-[#5a5a72] hover:text-white transition-colors"
                >
                  {copied === 'code' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied === 'code' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="code-block p-4 text-red-300 overflow-x-auto text-xs leading-5">
                <code>{selectedFunction.code}</code>
              </pre>
            </div>
          )}

          {/* Issues list */}
          {issues.length > 0 && (
            <div className="bg-[#0d0d12] border border-red-500/20 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-red-500/20 bg-red-500/5">
                <span className="text-xs font-medium text-red-400">Issues Found</span>
              </div>
              <ul className="p-4 space-y-2">
                {issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#aaaacc]">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">–</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* After: fixed code */}
          {fixedCode && (
            <div className="bg-[#0d0d12] border border-green-500/20 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-500/20 bg-green-500/5">
                <span className="text-xs font-medium text-green-400">After — Fixed Code</span>
                <button
                  onClick={() => copy(fixedCode, 'fix')}
                  className="flex items-center gap-1.5 text-xs text-[#5a5a72] hover:text-white transition-colors"
                >
                  {copied === 'fix' ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied === 'fix' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="code-block p-4 text-green-300 overflow-x-auto text-xs leading-5">
                <code>{fixedCode}</code>
              </pre>
            </div>
          )}

          {/* Improvements list */}
          {improvements.length > 0 && (
            <div className="bg-[#0d0d12] border border-blue-500/20 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/5">
                <span className="text-xs font-medium text-blue-400">AI Suggested Improvements</span>
              </div>
              <ul className="p-4 space-y-2">
                {improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#aaaacc]">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">+</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onApplyFix(selectedFunction)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Wrench size={14} />
              Apply Fix
            </button>
            <button
              onClick={() => copy(fixedCode || selectedFunction.code, 'patch')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1c1c26] border border-[#2a2a38] text-[#aaaacc] hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              {copied === 'patch' ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              Copy Patch
            </button>
          </div>

          {/* JSON debug toggle */}
          <div className="bg-[#0d0d12] border border-[#2a2a38] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowJson(!showJson)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#111117] transition-colors"
            >
              <span className="text-xs font-medium text-[#5a5a72]">AI Raw JSON Response</span>
              {showJson ? <ChevronDown size={14} className="text-[#5a5a72]" /> : <ChevronRight size={14} className="text-[#5a5a72]" />}
            </button>
            {showJson && (
              <pre className="code-block px-4 pb-4 text-[#8888a8] overflow-x-auto text-xs">
                <code>{JSON.stringify(selectedFunction, null, 2)}</code>
              </pre>
            )}
          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white">No Functions Selected</h3>
            <p className="text-sm text-[#5a5a72] mt-1">Select a function from the list to view its review</p>
          </div>
        </div>
      )}
    </div>
  )
}
