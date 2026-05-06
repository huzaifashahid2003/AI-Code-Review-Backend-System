import React, { useState, useEffect } from 'react'
import { Key, Github, Code, Shield, Bell, Save, CheckCircle, AlertCircle, Eye, EyeOff, LayoutDashboard } from 'lucide-react'

export default function Settings({ onGoToDashboard }) {
  const [groqApi, setGroqApi]         = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [masked, setMasked]           = useState({ groq: '', github: '' })
  const [showGroq, setShowGroq]       = useState(false)
  const [showGithub, setShowGithub]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/settings')
      .then(r => r.json())
      .then(d => setMasked({ groq: d.groq_api_masked || '', github: d.github_token_masked || '' }))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const body = {}
      if (groqApi.trim())     body.groq_api      = groqApi.trim()
      if (githubToken.trim()) body.github_token  = githubToken.trim()

      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 5000)

      const res = await fetch('http://localhost:8000/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`Server error ${res.status}`)

      // Refresh masked display
      const updated = await fetch('http://localhost:8000/settings').then(r => r.json())
      setMasked({ groq: updated.groq_api_masked || '', github: updated.github_token_masked || '' })
      setGroqApi('')
      setGithubToken('')
      setSaved(true)
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Could not reach backend. Is uvicorn running?' : e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {/* API Keys */}
      <div className="bg-[#111117] border border-[#2a2a38] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a38]">
          <Key size={15} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">API Configuration</h2>
        </div>
        <div className="px-4 py-4 space-y-4">
          {/* Groq API */}
          <div>
            <label className="block text-xs text-[#5a5a72] mb-1.5">
              Groq API Key
              {masked.groq && <span className="ml-2 text-green-400">● saved: {masked.groq}</span>}
            </label>
            <div className="relative">
              <input
                type={showGroq ? 'text' : 'password'}
                value={groqApi}
                onChange={e => setGroqApi(e.target.value)}
                placeholder="Paste new Groq API key (gsk_…)"
                className="w-full px-3 py-2 pr-10 bg-[#0d0d12] border border-[#2a2a38] rounded-lg text-sm text-white placeholder-[#3a3a4e] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button onClick={() => setShowGroq(v => !v)} className="absolute right-3 top-2.5 text-[#5a5a72] hover:text-white">
                {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* GitHub Token */}
          <div>
            <label className="block text-xs text-[#5a5a72] mb-1.5">
              GitHub Token
              {masked.github && <span className="ml-2 text-green-400">● saved: {masked.github}</span>}
            </label>
            <div className="relative">
              <input
                type={showGithub ? 'text' : 'password'}
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="Paste new GitHub token (ghp_…)"
                className="w-full px-3 py-2 pr-10 bg-[#0d0d12] border border-[#2a2a38] rounded-lg text-sm text-white placeholder-[#3a3a4e] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button onClick={() => setShowGithub(v => !v)} className="absolute right-3 top-2.5 text-[#5a5a72] hover:text-white">
                {showGithub ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle size={13} /> Keys saved successfully!
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || (!groqApi.trim() && !githubToken.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Keys'}
            </button>
            {saved && onGoToDashboard && (
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <LayoutDashboard size={14} />
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Preferences */}
      <Section title="Analysis Preferences" icon={<Code size={15} className="text-purple-400" />}>
        <Toggle label="Enable AI Code Review" defaultOn />
        <Toggle label="Auto-detect security vulnerabilities" defaultOn />
        <Toggle label="Check code style (PEP 8)" defaultOn />
        <Toggle label="Analyze complexity metrics" />
      </Section>

      <Section title="Notifications" icon={<Bell size={15} className="text-yellow-400" />}>
        <Toggle label="Email on high severity issues" defaultOn />
        <Toggle label="PR review notifications" defaultOn />
        <Toggle label="Weekly summary report" />
      </Section>

      <Section title="Security" icon={<Shield size={15} className="text-green-400" />}>
        <Toggle label="OWASP Top 10 checks" defaultOn />
        <Toggle label="SQL injection detection" defaultOn />
        <Toggle label="Secrets detection (API keys, passwords)" defaultOn />
      </Section>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-[#111117] border border-[#2a2a38] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a38]">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}

function Toggle({ label, defaultOn = false }) {
  const [on, setOn] = React.useState(defaultOn)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#aaaacc]">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-[#2a2a38]'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

