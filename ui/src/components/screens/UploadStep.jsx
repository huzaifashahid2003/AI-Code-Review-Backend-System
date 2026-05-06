import React, { useState, useRef } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle, Code, ArrowRight } from 'lucide-react'

const ALLOWED_EXTS = ['.py', '.txt']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export default function UploadStep({ onAnalyze }) {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateAndAdd = (incoming) => {
    setError(null)
    const valid = []
    for (const f of incoming) {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXTS.includes(ext)) {
        setError(`"${f.name}" is not supported. Only .py and .txt files are allowed.`)
        continue
      }
      if (f.size > MAX_SIZE) {
        setError(`"${f.name}" exceeds the 10 MB size limit.`)
        continue
      }
      if (files.some(x => x.name === f.name)) continue
      valid.push(f)
    }
    if (valid.length > 0) setFiles(prev => [...prev, ...valid])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    validateAndAdd(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) {
      validateAndAdd(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const removeFile = (name) => {
    setFiles(f => f.filter(x => x.name !== name))
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Upload Code</h1>
        <p className="text-sm text-[#5a5a72] mt-0.5">Upload Python files to analyze with AI</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".py,.txt"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-[#2a2a38] hover:border-[#3a3a4e] hover:bg-[#111117]'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Upload size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white font-medium">Drop your Python files here</p>
            <p className="text-sm text-[#5a5a72] mt-1">or <span className="text-blue-400 cursor-pointer hover:underline">browse files</span></p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5a5a72]">
            <span className="px-2 py-0.5 bg-[#1c1c26] rounded">.py</span>
            <span className="px-2 py-0.5 bg-[#1c1c26] rounded">.txt</span>
            <span>Max 10MB per file</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#aaaacc]">Files ready for analysis</h3>
            <span className="text-xs text-[#5a5a72]">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-3 p-3 bg-[#111117] border border-[#2a2a38] rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{file.name}</p>
                  <p className="text-xs text-[#5a5a72]">{formatSize(file.size)}</p>
                </div>
                <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                <button
                  onClick={() => removeFile(file.name)}
                  className="p-1 text-[#5a5a72] hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="mt-5 p-8 text-center bg-[#111117] border border-dashed border-[#2a2a38] rounded-xl">
          <File size={32} className="mx-auto text-[#3a3a4e] mb-3" />
          <p className="text-sm text-[#5a5a72]">No files selected yet</p>
          <p className="text-xs text-[#3a3a4e] mt-1">Add files using the drop zone above</p>
        </div>
      )}

      {/* Action */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => onAnalyze(files)}
          disabled={files.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          Analyze Code
          <ArrowRight size={15} />
        </button>
        <p className="text-xs text-[#5a5a72]">
          {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} will be analyzed` : 'Upload files to continue'}
        </p>
      </div>
    </div>
  )
}
