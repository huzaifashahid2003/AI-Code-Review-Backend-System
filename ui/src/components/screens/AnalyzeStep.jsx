import React, { useState, useEffect } from 'react'
import { Loader2, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

const ANALYSIS_STAGES = [
  { label: 'Parsing Python AST...' },
  { label: 'Running static analysis...' },
  { label: 'Detecting security vulnerabilities...' },
  { label: 'Checking code style and complexity...' },
  { label: 'Generating AI review with LLM...' },
  { label: 'Compiling results...' },
]

export default function AnalyzeStep({ files, onComplete, onCancel }) {
  const [progress, setProgress] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!files || files.length === 0) {
      setError('No files to analyze. Please go back and upload files first.')
      return
    }

    let cancelled = false
    let ticker = null

    const run = async () => {
      // Animate progress while waiting for the API
      let sim = 0
      ticker = setInterval(() => {
        sim = Math.min(sim + 0.8, 88)
        setProgress(sim)
        setStageIdx(Math.floor((sim / 88) * (ANALYSIS_STAGES.length - 1)))
      }, 120)

      try {
        const results = []
        for (const file of files) {
          if (cancelled) return
          const formData = new FormData()
          formData.append('file', file)
          let res
          try {
            res = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData })
          } catch {
            throw new Error(`Could not reach the server. Make sure the backend is running on port 8000.`)
          }
          if (!res.ok) throw new Error(`Server error (${res.status}) while analyzing "${file.name}"`)
          let data
          try {
            data = await res.json()
          } catch {
            throw new Error(`Invalid response from server while analyzing "${file.name}"`)
          }
          if (data.error) throw new Error(`Backend error: ${data.error}`)
          results.push(data)
        }

        if (!cancelled) {
          clearInterval(ticker)
          setProgress(100)
          setStageIdx(ANALYSIS_STAGES.length - 1)
          setDone(true)
          setTimeout(() => onComplete(results), 800)
        }
      } catch (err) {
        clearInterval(ticker)
        if (!cancelled) setError(err.message)
      }
    }

    run()
    return () => {
      cancelled = true
      clearInterval(ticker)
    }
  }, [])

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-lg text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-xl font-semibold text-white">Analysis Failed</h2>
          <p className="text-sm text-[#5a5a72] mt-2">{error}</p>
          <button
            onClick={onCancel}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#1c1c26] border border-[#2a2a38] text-[#8888a8] hover:text-white rounded-lg text-sm transition-colors mx-auto"
          >
            <X size={14} />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          {done ? (
            <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
          ) : (
            <div className="relative w-12 h-12 mx-auto mb-3">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-white">
            {done ? 'Analysis Complete' : 'Analyzing Code…'}
          </h2>
          <p className="text-sm text-[#5a5a72] mt-1">
            {done ? 'Redirecting to review...' : 'AI is reviewing your code for issues'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-[#1c1c26] rounded-full h-2 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-200 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#5a5a72] mb-6">
          <span>{ANALYSIS_STAGES[Math.min(stageIdx, ANALYSIS_STAGES.length - 1)].label}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Stage list */}
        <div className="bg-[#111117] border border-[#2a2a38] rounded-xl p-4 space-y-2.5">
          {ANALYSIS_STAGES.map((stage, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${
              i < stageIdx ? 'text-green-400' :
              i === stageIdx ? 'text-white' :
              'text-[#3a3a4e]'
            }`}>
              {i < stageIdx ? (
                <CheckCircle size={14} className="flex-shrink-0" />
              ) : i === stageIdx ? (
                <Loader2 size={14} className="flex-shrink-0 animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-current flex-shrink-0" />
              )}
              {stage.label}
            </div>
          ))}
        </div>

        {/* Files being analyzed */}
        <div className="mt-4 flex items-center gap-3 p-3 bg-[#111117] border border-[#2a2a38] rounded-lg">
          <div className="flex-1 text-xs text-[#5a5a72]">
            Analyzing:{' '}
            {files && files.map((f, i) => (
              <span key={f.name}>
                <span className="text-white">{f.name}</span>
                {i < files.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>

        {/* Cancel */}
        {!done && (
          <div className="mt-4 flex items-center gap-3 justify-center">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-[#1c1c26] border border-[#2a2a38] text-[#8888a8] hover:text-white rounded-lg text-sm transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
