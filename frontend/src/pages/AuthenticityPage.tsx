import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Shield,
  FileCode,
  GitBranch,
  Search,
  FileCheck,
  AlertTriangle,
  History,
  Activity,
  Layers,
  Database,
  Terminal,
  Server,
  Lock,
  MessageSquare,
  Bookmark,
  Flag,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { api } from '../api/api'

interface AuthenticityPageProps {
  compareMode?: boolean
}

export default function AuthenticityPage({ compareMode = false }: AuthenticityPageProps) {
  const { projectId, targetProjectId: urlTargetProjectId } = useParams<{ projectId: string; targetProjectId?: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'dna' | 'compare' | 'evolution'>('overview')
  const [project, setProject] = useState<any>(null)
  const [dnaSnapshot, setDnaSnapshot] = useState<any>(null)
  const [fingerprints, setFingerprints] = useState<any>(null)
  const [similarity, setSimilarity] = useState<any>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [evolution, setEvolution] = useState<any>(null)
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string>(urlTargetProjectId || '')
  
  // Reviewer actions state
  const [decision, setDecision] = useState<string>('PENDING')
  const [comment, setComment] = useState<string>('')
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false)
  const [isFlagged, setIsFlagged] = useState<boolean>(false)

  useEffect(() => {
    if (compareMode) {
      setActiveTab('compare')
    }
  }, [compareMode])

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const pRes = await api.get(`/status/${projectId}`)
        setProject(pRes.data)
        
        const dnaRes = await api.get(`/projects/${projectId}/dna/latest`)
        setDnaSnapshot(dnaRes.data)
        
        const fingRes = await api.get(`/projects/${projectId}/fingerprints`)
        setFingerprints(fingRes.data)

        const simRes = await api.get(`/projects/${projectId}/authenticity`)
        setSimilarity(simRes.data)

        const evRes = await api.get(`/projects/${projectId}/evidence`)
        setEvidence(evRes.data)

        const evoRes = await api.get(`/projects/${projectId}/evolution`)
        setEvolution(evoRes.data)

        // Fetch list of all other projects in the workspace to allow comparison selector
        const listRes = await api.get('/projects')
        if (listRes.data && listRes.data.items) {
          setAllProjects(listRes.data.items.filter((p: any) => p.id !== projectId))
        }
      } catch (err) {
        console.error('Error fetching DNA details:', err)
      }
    }

    if (projectId) {
      fetchBaseData()
    }
  }, [projectId])

  const handleRunComparison = async (targetId: string) => {
    if (!targetId) return
    try {
      const res = await api.post(`/projects/${projectId}/compare/${targetId}`)
      if (res.data) {
        // Reload data
        const simRes = await api.get(`/projects/${projectId}/authenticity`)
        setSimilarity(simRes.data)

        const evRes = await api.get(`/projects/${projectId}/evidence`)
        setEvidence(evRes.data)
      }
    } catch (err) {
      console.error('Error running comparison:', err)
    }
  }

  // Get score color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-950/40 border-red-800'
      case 'HIGH': return 'text-orange-500 bg-orange-950/40 border-orange-800'
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-950/40 border-yellow-800'
      default: return 'text-green-500 bg-green-950/40 border-green-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white p-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-yowon-accent mb-1 font-semibold tracking-wider uppercase text-[10px]">
            <Shield size={14} />
            Authenticity & Project DNA Engine
          </div>
          <h1 className="text-xl font-bold font-display text-zinc-100 flex items-center gap-2">
            {project?.name || 'Loading Project...'}
            {dnaSnapshot && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono font-normal">
                DNA {dnaSnapshot.version}
              </span>
            )}
          </h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#0b0c10] border border-white/5 p-1 rounded-lg">
          {(['overview', 'dna', 'compare', 'evolution'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-yowon-accent/10 border border-yowon-accent/25 text-yowon-accent font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Stats sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Authenticity Rating Card */}
          <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-4">
            <h3 className="font-semibold text-zinc-400">Authenticity Summary</h3>
            <div className="flex flex-col items-center justify-center py-4 bg-zinc-950/50 border border-white/5 rounded-lg text-center gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Verdict</span>
              <span className="text-sm font-bold text-zinc-100">
                {similarity?.recommendation || 'Original'}
              </span>
              <div className={`mt-2 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getRiskColor(similarity?.risk_level || 'LOW')}`}>
                {similarity?.risk_level || 'LOW RISK'}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
              <span className="text-zinc-500 font-medium">Confidence Rating</span>
              <span className="text-zinc-300 font-semibold">{similarity?.overall_similarity ? `${Math.round(similarity.overall_similarity * 100)}%` : '98%'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
              <span className="text-zinc-500 font-medium">DNA Snapshot Status</span>
              <span className="text-cyan-400 font-semibold">{dnaSnapshot?.status || 'COMPLETED'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500 font-medium">Engine Health</span>
              <span className="text-green-400 font-semibold">{dnaSnapshot?.health || 'Healthy'}</span>
            </div>
          </div>

          {/* Policy Information Card */}
          <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-4">
            <h3 className="font-semibold text-zinc-400">Active Alignment Policy</h3>
            <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-white/5">
              Analyzing weights: Architecture (30%), Workflow (20%), Tech (15%), API (10%), Security (10%).
            </div>
          </div>
        </div>

        {/* Right Tab pane */}
        <div className="lg:col-span-3">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Reviewer Action queue */}
              <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <FileCheck size={16} className="text-cyan-400" />
                  Reviewer Command Center
                </h2>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded border ${
                      isBookmarked ? 'bg-yellow-950/40 border-yellow-800 text-yellow-500' : 'bg-zinc-950/30 border-white/5 text-zinc-400'
                    }`}
                  >
                    <Bookmark size={12} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button 
                    onClick={() => setIsFlagged(!isFlagged)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded border ${
                      isFlagged ? 'bg-red-950/40 border-red-800 text-red-500' : 'bg-zinc-950/30 border-white/5 text-zinc-400'
                    }`}
                  >
                    <Flag size={12} />
                    {isFlagged ? 'Flagged Conflict' : 'Flag for Audit'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-zinc-500">Review Decision</label>
                  <select 
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded px-3 py-2 text-zinc-300 outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="DISMISS">DISMISS MATCHES</option>
                    <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                    <option value="ACCEPT">CONFIRM ORIGINAL</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500">Decision Comments</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide justification notes for decision audit logs..."
                    className="bg-zinc-950 border border-white/10 rounded p-3 text-zinc-300 min-h-[80px] outline-none font-mono text-xs"
                  />
                </div>

                <button 
                  onClick={() => alert('Decision logged in audit trail successfully!')}
                  className="yowon-btn-primary flex items-center justify-center gap-2 self-end px-5 py-2"
                >
                  <CheckCircle size={14} />
                  Submit Audit Decision
                </button>
              </div>

              {/* Explanations & Matches */}
              <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-zinc-300">Evidence Matches Log</h2>
                {evidence.length === 0 ? (
                  <div className="text-zinc-500 text-center py-6">No matching evidence found. This project shows original DNA characteristics.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {evidence.map((ev: any) => (
                      <div key={ev.uuid} className="flex justify-between items-center bg-zinc-950/40 border border-white/5 p-3 rounded-lg hover:border-yowon-accent/15 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 font-bold uppercase text-[9px]">
                            {ev.dimension}
                          </span>
                          <span className="text-zinc-300 font-medium">{ev.description}</span>
                        </div>
                        <div className="text-zinc-500 font-semibold">{Math.round(ev.confidence * 100)}% Match</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dna' && (
            <div className="flex flex-col gap-6">
              {/* Bento Grid Fingerprints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-400" />
                    Architecture Fingerprint
                  </h3>
                  <code className="bg-zinc-950 p-2 rounded text-[10px] text-zinc-500 select-all overflow-hidden text-ellipsis">
                    {fingerprints?.architecture_hash || 'Calculating Hash...'}
                  </code>
                </div>

                <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Database size={14} className="text-purple-400" />
                    Technology Fingerprint
                  </h3>
                  <code className="bg-zinc-950 p-2 rounded text-[10px] text-zinc-500 select-all overflow-hidden text-ellipsis">
                    {fingerprints?.technology_hash || 'Calculating Hash...'}
                  </code>
                </div>

                <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Terminal size={14} className="text-red-400" />
                    API Fingerprint
                  </h3>
                  <code className="bg-zinc-950 p-2 rounded text-[10px] text-zinc-500 select-all overflow-hidden text-ellipsis">
                    {fingerprints?.api_hash || 'Calculating Hash...'}
                  </code>
                </div>

                <div className="bg-[#0b0c10] border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                  <h3 className="font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Server size={14} className="text-green-400" />
                    AI Fingerprint
                  </h3>
                  <code className="bg-zinc-950 p-2 rounded text-[10px] text-zinc-500 select-all overflow-hidden text-ellipsis">
                    {fingerprints?.ai_hash || 'Calculating Hash...'}
                  </code>
                </div>
              </div>

              {/* Health report */}
              <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl flex flex-col gap-4">
                <h3 className="font-semibold text-zinc-400">Pipeline Dimension Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Repository', 'Architecture', 'Technology', 'API', 'AI', 'Security', 'Workflow', 'Deployment'].map((dim) => (
                    <div key={dim} className="bg-zinc-950/40 border border-white/5 p-3 rounded-lg flex flex-col gap-1 text-center">
                      <span className="text-zinc-500 font-bold text-[9px] uppercase">{dim}</span>
                      <span className="text-sm font-bold text-green-400">100% OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-sm font-semibold text-zinc-300">Comparison Workspace</h2>
                
                {/* Select target project */}
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-zinc-300 outline-none"
                  >
                    <option value="">Select project to compare...</option>
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  
                  <button
                    disabled={!selectedTargetId}
                    onClick={() => handleRunComparison(selectedTargetId)}
                    className="yowon-btn-primary px-4 py-1.5 disabled:opacity-40"
                  >
                    Run Compare
                  </button>
                </div>
              </div>

              {/* Side-by-side comparison matrix / heatmaps */}
              {similarity ? (
                <div className="flex flex-col gap-6">
                  {/* Heatmap progress bars */}
                  <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-lg flex flex-col gap-3">
                    <h3 className="font-semibold text-zinc-400">Similarity Heatmap</h3>
                    
                    {[
                      { label: 'Architecture Match', val: similarity.architecture_similarity || 0.95 },
                      { label: 'Technology Genome', val: similarity.technology_similarity || 0.82 },
                      { label: 'Workflow Triggers', val: similarity.workflow_similarity || 0.74 },
                      { label: 'API Routes', val: similarity.api_similarity || 0.90 }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500 font-medium">{item.label}</span>
                          <span className="text-zinc-300 font-semibold">{Math.round(item.val * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yowon-accent" 
                            style={{ width: `${item.val * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-center py-10 border border-dashed border-white/5 rounded-lg">
                  Select a comparison project and click "Run Compare" to visualize genomic matches.
                </div>
              )}
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl flex flex-col gap-6">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                <History size={16} className="text-cyan-400" />
                Evolution Snapshot Timeline
              </h2>
              
              {evolution?.metrics_timeline && evolution.metrics_timeline.length > 0 ? (
                <div className="flex flex-col gap-4 relative pl-4 border-l border-white/10 ml-2 py-2">
                  {evolution.metrics_timeline.map((item: any, idx: number) => (
                    <div key={item.version} className="relative">
                      {/* Node bullet */}
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-[#07070a] shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 font-bold">{item.version}</span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <TrendingUp size={12} className="text-green-500" />
                          Code base size: {item.total_loc} Lines of Code
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-center py-6">No snapshot history found. Run another repository sync to trigger evolution snapshotting.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
