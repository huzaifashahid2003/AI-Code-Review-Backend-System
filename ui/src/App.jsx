import React, { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import Dashboard from './components/screens/Dashboard'
import UploadStep from './components/screens/UploadStep'
import AnalyzeStep from './components/screens/AnalyzeStep'
import ReviewStep from './components/screens/ReviewStep'
import FixStep from './components/screens/FixStep'
import RerunStep from './components/screens/RerunStep'
import GithubIntegration from './components/screens/GithubIntegration'
import PRReview from './components/screens/PRReview'
import Settings from './components/screens/Settings'

function computeStats(results) {
  let issuesFound = 0
  let highSeverity = 0
  const criticalIssues = []

  for (const r of results) {
    for (const func of (r.analysis || [])) {
      const review = func.review || {}
      issuesFound += (review.issues || []).length
      if ((review.severity || '').toLowerCase() === 'high') {
        highSeverity++
        if (criticalIssues.length < 5) {
          const first = (review.issues || [])[0]
          const label = typeof first === 'string' ? first : (first?.message || 'High severity issue')
          criticalIssues.push({ label, detail: `in ${func.function} (${r.filename})` })
        }
      }
    }
  }

  const activity = results.map(r => ({
    type: 'analyzed',
    file: r.filename,
    time: 'just now',
    status: r.error ? 'warning' : 'success',
  }))

  return { filesAnalyzed: results.length, issuesFound, highSeverity, activity, criticalIssues }
}

const EMPTY_STATS = { filesAnalyzed: 0, issuesFound: 0, highSeverity: 0, activity: [], criticalIssues: [] }

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [selectedPR, setSelectedPR] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [analysisResults, setAnalysisResults] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)

  const navigate = (target) => setScreen(target)

  // On first load: check if API keys are saved; if not, send to setup
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    fetch('http://localhost:8000/settings', { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        clearTimeout(timeout)
        if (d.groq_api_set && d.github_token_set) {
          setScreen('dashboard')
        } else {
          setScreen('setup')
        }
      })
      .catch(() => {
        clearTimeout(timeout)
        setScreen('dashboard') // backend offline → go dashboard anyway
      })
  }, [])

  const handleApplyFix = (issue) => {
    setSelectedIssue(issue)
    setScreen('step-fix')
  }

 const handleOpenPR = (pr) => {
    console.log("PR data:", pr)
    console.log("Screen:", screen)
    setSelectedPR(pr)
    setScreen('pr-review')
    console.log("Screen set to pr-review")
}
  const renderContent = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard stats={stats} onStartAnalysis={() => navigate('step-upload')} />
      case 'upload':
      case 'step-upload':
        return <UploadStep onAnalyze={(files) => { setUploadedFiles(files); navigate('step-analyze') }} />
      case 'step-analyze':
        return (
          <AnalyzeStep
            files={uploadedFiles}
            onComplete={(results) => {
              setAnalysisResults(results)
              const newStats = computeStats(results)
              setStats(prev => ({
                filesAnalyzed: prev.filesAnalyzed + newStats.filesAnalyzed,
                issuesFound: prev.issuesFound + newStats.issuesFound,
                highSeverity: prev.highSeverity + newStats.highSeverity,
                activity: [...newStats.activity, ...prev.activity].slice(0, 10),
                criticalIssues: [...newStats.criticalIssues, ...prev.criticalIssues].slice(0, 5),
              }))
              navigate('step-review')
            }}
            onCancel={() => navigate('step-upload')}
          />
        )
      case 'step-review':
        return <ReviewStep results={analysisResults} onApplyFix={handleApplyFix} />
      case 'step-fix':
        return <FixStep issue={selectedIssue} onBack={() => navigate('step-review')} onRerun={() => navigate('step-rerun')} />
      case 'step-rerun':
        return <RerunStep onGoToDashboard={() => navigate('dashboard')} />
      case 'reviews':
        return <ReviewStep results={analysisResults} onApplyFix={handleApplyFix} />
      case 'github':
        return <GithubIntegration onOpenPR={handleOpenPR} />
      case 'pr-reviews':
        return <GithubIntegration onOpenPR={handleOpenPR} />
      case 'pr-review':
        return <PRReview pr={selectedPR} />
       case 'settings':
        return <Settings onGoToDashboard={() => navigate('dashboard')} />
      default:
        return <Dashboard stats={stats} onStartAnalysis={() => navigate('step-upload')} />
    }
  }

  // Full-page setup screen (no sidebar/navbar)
  if (screen === 'loading') {
    return (
      <div className="flex h-screen bg-[#0a0a0f] items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome to CodeSentinel AI</h1>
            <p className="text-sm text-[#5a5a72] mt-2">Paste your API keys to get started. These are saved to your local <code className="text-blue-400">.env</code> file.</p>
          </div>
          <Settings onGoToDashboard={() => navigate('dashboard')} />
        </div>
      </div>
    )
  }

  // Screens that fill full height (no internal scroll padding)
  const fullHeightScreens = ['step-review', 'pr-review', 'reviews', 'step-analyze']
  const isFullHeight = fullHeightScreens.includes(screen)

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar activeScreen={screen} onNavigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeScreen={screen} />
        <main className={`flex-1 ${isFullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
