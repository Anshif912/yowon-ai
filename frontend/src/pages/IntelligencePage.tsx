import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BookOpen, Cpu, Activity, Layers, Brain, Compass, 
  ShieldCheck, BarChart3, Wrench, Map, Settings, PlayCircle, ArrowLeft
} from 'lucide-react'

// Data hooks & Context Wrapper
import { RepositoryIntelligenceWrapper, useSharedIntelligenceContext } from '../components/report/RepositoryIntelligenceWrapper'

// Views
import OverviewPanel from '../components/report/OverviewPanel'
import { RepositoryStoryPanel } from '../components/report/RepositoryStoryPanel'
import RepositoryTreePanel from '../components/report/RepositoryTreePanel'
import { ArchitectureGraphPanel } from '../components/report/ArchitectureGraphPanel'
import TechnologyGraphPanel from '../components/report/TechnologyGraphPanel'
import DependencyGraphPanel from '../components/report/DependencyGraphPanel'
import KnowledgeGraphPanel from '../components/report/KnowledgeGraphPanel'
import ExecutionFlowPanel from '../components/report/ExecutionFlowPanel'
import { AIAgentsPanel } from '../components/report/AIAgentsPanel'
import EvidenceExplorerPanel from '../components/report/EvidenceExplorerPanel'
import MetricsPanel from '../components/report/MetricsPanel'
import DiagnosticsPanel from '../components/report/DiagnosticsPanel'
import RecommendationsPanel from '../components/report/RecommendationsPanel'
import { RoadmapPanel } from '../components/report/RoadmapPanel'

interface TabSection {
  id: string
  label: string
  icon: any
  question: string
  answer: string
}

const TABS: TabSection[] = [
  { id: 'overview',        label: 'Consensus Overview',    icon: Compass,      question: 'Where does this codebase stand overall?', answer: 'Provides a consolidated ready-verdict executive scorecard summarizing all AI agents evaluations.' },
  { id: 'story',           label: 'Repository Story',      icon: BookOpen,     question: 'What is this repository and how does it work?', answer: 'Detailed 9-field concise executive brief outlining code identity, purposes, patterns, and security postures.' },
  { id: 'architecture',    label: 'Architecture View',     icon: Layers,       question: 'How is the system structured?', answer: 'Maps modular logical stages (Frontend, Controllers, Services, Databases) to analyze structural topology.' },
  { id: 'technology',      label: 'Technology View',       icon: Cpu,          question: 'What technologies are used, where, and why?', answer: 'Shows category concentric circles (AI, cloud, databases) mapping package versions and usage limits.' },
  { id: 'dependency',      label: 'Dependency View',       icon: PlayCircle,   question: 'What depends on what? Where are the bottlenecks?', answer: 'Uncovers circular import loops and coupling metrics to highlight hotspot files.' },
  { id: 'knowledge',       label: 'Knowledge View',        icon: Brain,        question: 'Where should I start understanding this repository?', answer: 'Progressive radial subsystems mind-map starting at the codebase core.' },
  { id: 'runtime',         label: 'Runtime View',          icon: Activity,     question: 'How does a request travel through the system?', answer: 'Traces execution pipelines log streams, stage warnings, and processing durations.' },
  { id: 'agents',          label: 'AI Agents View',        icon: Cpu,          question: 'Who evaluated the codebase?', answer: 'Displays collaboration score networks between the 8 specialized evaluator agents.' },
  { id: 'evidence',        label: 'Security View',         icon: ShieldCheck,  question: 'What static vulnerabilities exist?', answer: 'Filters scanned rules warnings and secret exposure parameters.' },
  { id: 'files',           label: 'File Explorer',         icon: FileTextIcon, question: 'Where are the code components located?', answer: 'IDE-like outline explorer allowing direct class methods code inspection.' },
  { id: 'metrics',         label: 'Metrics View',          icon: BarChart3,    question: 'What are the quality index numbers?', answer: 'AST-derived complexity ratios, coupling counts, and maintainability indices.' },
  { id: 'recommendations', label: 'Recommendations',      icon: Wrench,       question: 'What refactoring improvements are needed?', answer: 'Lists AI-generated code fixes, libraries decoupling paths, and credentials config warnings.' },
  { id: 'deployment',      label: 'Deployment Roadmap',    icon: Map,          question: 'How should this codebase migrate?', answer: 'Generates 8-phase actionable prioritized deployment roadmaps.' },
  { id: 'diagnostics',     label: 'Diagnostics View',      icon: Settings,     question: 'What system logs are available?', answer: 'System diagnostic telemetries log records from Ollama execution models.' }
]

// Fallback Icon definition for Files tab to avoid TS errors
function FileTextIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

export default function IntelligencePage() {
  const { projectId, tab } = useParams<{ projectId: string; tab?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!projectId) {
      navigate('/projects')
      return
    }
    if (!tab) {
      const savedTab = localStorage.getItem('yowon_last_intel_tab') || 'overview'
      navigate(`/intelligence/${projectId}/${savedTab}`, { replace: true })
    }
  }, [projectId, tab, navigate])

  if (!projectId) return null

  return (
    <RepositoryIntelligenceWrapper projectId={projectId}>
      <IntelligenceContent projectId={projectId} activeTab={tab || 'overview'} />
    </RepositoryIntelligenceWrapper>
  )
}

function IntelligenceContent({ projectId, activeTab }: { projectId: string; activeTab: string }) {
  const context = useSharedIntelligenceContext()
  const navigate = useNavigate()

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0]

  const handleTabChange = (tabId: string) => {
    localStorage.setItem('yowon_last_intel_tab', tabId)
    navigate(`/intelligence/${projectId}/${tabId}`)
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel projectId={projectId} />
      case 'story':
        return <RepositoryStoryPanel projectId={projectId} />
      case 'architecture':
        return <ArchitectureGraphPanel projectId={projectId} />
      case 'technology':
        return <TechnologyGraphPanel projectId={projectId} />
      case 'dependency':
        return <DependencyGraphPanel projectId={projectId} />
      case 'knowledge':
        return <KnowledgeGraphPanel projectId={projectId} />
      case 'runtime':
        return <ExecutionFlowPanel projectId={projectId} />
      case 'agents':
        return <AIAgentsPanel projectId={projectId} />
      case 'evidence':
        return <EvidenceExplorerPanel projectId={projectId} />
      case 'files':
        return <RepositoryTreePanel projectId={projectId} />
      case 'metrics':
        return <MetricsPanel projectId={projectId} />
      case 'recommendations':
        return <RecommendationsPanel projectId={projectId} />
      case 'deployment':
        return <RoadmapPanel projectId={projectId} />
      case 'diagnostics':
        return <DiagnosticsPanel projectId={projectId} />
      default:
        return <OverviewPanel projectId={projectId} />
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 h-full">
      
      {/* ── Active View Content Canvas (No scrolling container wrapper) ── */}
      <main className="flex-1 min-w-0 space-y-6 overflow-y-auto p-6 custom-scrollbar">
        
        {/* Breadcrumb Back Navigation Header Bar */}
        {activeTab !== 'overview' && (
          <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4 font-mono text-[10px]">
            <button 
              onClick={() => handleTabChange('overview')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowLeft size={11} />
              <span>Back to Overview</span>
            </button>
            <div className="h-4 w-px bg-white/[0.08]" />
            <span className="text-zinc-500 uppercase tracking-widest">Active Workspace:</span>
            <span className="text-white font-bold">{context.rkm?.metadata.name || 'Codebase'}</span>
          </div>
        )}

        {/* Graph Explainability Header Subtitle (Phase 8) */}
        {activeTab !== 'overview' && (
          <div className="p-4 border border-cyan-500/10 bg-cyan-950/[0.015] rounded-xl flex items-center justify-between gap-4 font-mono text-[10px] text-white">
            <div className="space-y-0.5">
              <span className="text-cyan-400 font-bold uppercase tracking-wider block">Question: {currentTab.question}</span>
              <p className="text-zinc-400 font-sans leading-relaxed mt-0.5">{currentTab.answer}</p>
            </div>
          </div>
        )}

        {/* Render View */}
        <div className="relative">
          {renderActiveView()}
        </div>

        {/* Progressive Navigation Footer */}
        {activeTab !== 'overview' && (() => {
          const activeIndex = TABS.findIndex(t => t.id === activeTab)
          const prevTab = activeIndex > 0 ? TABS[activeIndex - 1] : null
          const nextTab = activeIndex < TABS.length - 1 ? TABS[activeIndex + 1] : null

          return (
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 mt-8 font-mono text-[11px] relative z-10">
              {prevTab ? (
                <button
                  onClick={() => handleTabChange(prevTab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Previous: {prevTab.label}
                </button>
              ) : <div />}

              <button
                onClick={() => handleTabChange('overview')}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to Overview
              </button>

              {nextTab ? (
                <button
                  onClick={() => handleTabChange(nextTab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Next: {nextTab.label} →
                </button>
              ) : <div />}
            </div>
          )
        })()}

      </main>
    </div>
  )
}
