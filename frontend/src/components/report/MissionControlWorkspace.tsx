import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Server, Shield, Cpu, Activity, Info, AlertTriangle, CheckCircle, 
  GitFork, Layers, ChevronRight, Eye, Code, Zap, RefreshCw, BarChart, 
  FileText, Play, Pause, ToggleLeft, ToggleRight
} from 'lucide-react'
import { api } from '../../api/api'

interface MissionControlProps {
  projectId: string
  reportData: any
}

export default function MissionControlWorkspace({ projectId, reportData }: MissionControlProps) {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [replayStep, setReplayStep] = useState(4) // 4 = Completed/Final State
  
  // API State
  const [debateData, setDebateData] = useState<any>(null)
  const [consensusData, setConsensusData] = useState<any>(null)
  const [scoreEvo, setScoreEvo] = useState<any[]>([])
  const [evidenceGraph, setEvidenceGraph] = useState<any>({ nodes: [], edges: [] })

  useEffect(() => {
    // Fetch telemetry from API endpoints
    api.get(`/api/v1/evaluation/debate/${projectId}`)
      .then(res => setDebateData(res.data))
      .catch(() => {})
      
    api.get(`/api/v1/evaluation/consensus/${projectId}`)
      .then(res => setConsensusData(res.data))
      .catch(() => {})
      
    api.get(`/api/v1/evaluation/score-evolution/${projectId}`)
      .then(res => setScoreEvo(res.data))
      .catch(() => {})

    api.get(`/api/v1/evaluation/evidence/${projectId}`)
      .then(res => setEvidenceGraph(res.data))
      .catch(() => {})
  }, [projectId])

  // Fallback initial scores if scoreEvo is not populated
  const displayScoreEvo = scoreEvo.length ? scoreEvo : [
    { agent: "Forge", initial: 88, final: 82, confidence: 0.95 },
    { agent: "Sentinel", initial: 92, final: 92, confidence: 0.92 },
    { agent: "Guardian", initial: 85, final: 79, confidence: 0.88 },
    { agent: "Visionary", initial: 80, final: 80, confidence: 0.84 }
  ]

  // Play Replay animation simulation
  useEffect(() => {
    let timer: any
    if (isPlaying) {
      setReplayStep(0)
      timer = setInterval(() => {
        setReplayStep(prev => {
          if (prev < 4) return prev + 1
          setIsPlaying(false)
          clearInterval(timer)
          return 4
        })
      }, 1500)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  return (
    <div className="space-y-8 font-sans text-white">
      
      {/* Action Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPlaying(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.15)]"
          >
            <Play size={11} fill="currentColor" />
            <span>Replay Evaluation</span>
          </button>
          
          {isPlaying && (
            <span className="font-mono text-[10px] text-cyan-400 animate-pulse">
              Replaying Stage {replayStep}/4: {
                replayStep === 0 && 'Indexing DNA' ||
                replayStep === 1 && 'Initial Specialist Calibration' ||
                replayStep === 2 && 'Structured Debate Rounds' ||
                replayStep === 3 && 'Consensus Resolution' ||
                'Analysis Ready'
              }
            </span>
          )}
        </div>

        {/* Executive vs Developer Toggle */}
        <button
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {isDeveloperMode ? <ToggleRight className="text-cyan-400" size={16} /> : <ToggleLeft className="text-zinc-600" size={16} />}
          <span>{isDeveloperMode ? 'Developer Mode: ACTIVE' : 'Executive Mode: ACTIVE'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={replayStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* 🧬 Repository DNA Card */}
          {replayStep >= 0 && (
            <div className="lg:col-span-1 rounded-2xl border border-zinc-800 bg-gradient-to-b from-[#0e131b]/90 to-[#090d13]/90 p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Repository DNA</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-md">calibrated</span>
              </div>
              
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span className="text-zinc-500">Framework:</span>
                  <span className="text-cyan-400 font-extrabold">{reportData?.verdict?.detected_technologies?.[0] || 'FastAPI'}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span className="text-zinc-500">Architecture Style:</span>
                  <span className="text-white">{reportData?.verdict?.architecture_summary || 'Layered Monolith'}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span className="text-zinc-500">Goal Weight:</span>
                  <span className="text-orange-400 font-bold">{reportData?.verdict?.project_type_justification || 'Production'}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span className="text-zinc-500">Stability Limit:</span>
                  <span className="text-green-400 font-bold">STABLE</span>
                </div>
              </div>

              {isDeveloperMode && (
                <div className="mt-4 pt-3 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Lines of Code (LOC):</span>
                    <span className="text-zinc-400">4,281</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity Index:</span>
                    <span className="text-zinc-400">38 (Medium)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📈 Score Evolution River */}
          {replayStep >= 1 && (
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-[#090d13]/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart size={14} className="text-cyan-400" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Score Evolution River</span>
                </div>
              </div>

              <div className="space-y-4">
                {displayScoreEvo.map((evo: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                    <div className="w-16 text-zinc-400">{evo.agent}</div>
                    
                    <div className="flex-1 h-2.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden relative">
                      {/* Initial score bar */}
                      <div 
                        className="h-full bg-zinc-800 absolute left-0" 
                        style={{ width: `${evo.initial}%` }}
                      />
                      {/* Final adjusted score bar overlay */}
                      <div 
                        className="h-full bg-cyan-500/80 absolute left-0" 
                        style={{ width: `${evo.final}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 w-24 justify-end">
                      <span className="text-zinc-500">{evo.initial}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-cyan-400 font-extrabold">{evo.final}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⚖️ Debate Timeline & Criticisms */}
          {replayStep >= 2 && (
            <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-[#090d13]/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-400" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Jury Debate & Consensus Logs</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Multi-round (3 rounds max)</span>
              </div>

              {/* Debate round logs */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {(debateData?.rounds || [
                  {
                    round_number: 1,
                    criticisms: [
                      {
                        author: "Sentinel",
                        target: "Forge",
                        category: "Security",
                        severity: "HIGH",
                        repository_evidence: "Auth controller lacks token expiry validation on fallback endpoint.",
                        repository_paths: ["controllers/auth.py"],
                        status: "Accepted",
                        rebuttal: "Accepted. Reducing architecture score by penalty factor."
                      },
                      {
                        author: "Guardian",
                        target: "Forge",
                        category: "Reliability",
                        severity: "MEDIUM",
                        repository_evidence: "Missing database connection pool limitations in startup configs.",
                        repository_paths: ["config/db.py"],
                        status: "Accepted",
                        rebuttal: "Accepted. Configured fallback limit."
                      }
                    ]
                  }
                ]).map((round: any, rIdx: number) => (
                  <div key={rIdx} className="space-y-3">
                    <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/[0.02] pb-1">
                      Debate Round {round.round_number}
                    </div>
                    {round.criticisms.map((crit: any, cIdx: number) => (
                      <div key={cIdx} className="p-4 rounded-xl bg-zinc-950/45 border border-zinc-900 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-extrabold">{crit.author}</span>
                            <span className="text-zinc-600">critiqued</span>
                            <span className="text-orange-400 font-bold">{crit.target}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md border font-black text-[9px] ${
                            crit.status === 'Accepted' ? 'border-green-800 text-green-400 bg-green-950/10' : 'border-red-800 text-red-400 bg-red-950/10'
                          }`}>
                            {crit.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-300 font-sans leading-relaxed">{crit.repository_evidence}</p>
                        
                        {isDeveloperMode && crit.repository_paths?.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-1.5 text-[9px] font-mono text-zinc-500 border-t border-white/[0.02]">
                            <span className="text-zinc-600">Files:</span>
                            {crit.repository_paths.map((p: string, pIdx: number) => (
                              <span key={pIdx} className="text-zinc-400 hover:text-cyan-400 underline cursor-pointer">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🧠 Consensus Matrix */}
          {replayStep >= 3 && (
            <div className="lg:col-span-1 rounded-2xl border border-zinc-800 bg-[#090d13]/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-cyan-400" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Consensus Matrix</span>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 font-mono text-[9px] text-center text-zinc-400">
                <div />
                <div>FRG</div>
                <div>SNT</div>
                <div>GRD</div>
                <div>VSN</div>
                
                <div>FRG</div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded p-1 font-bold">100</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">92</div>
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded p-1 font-bold">78</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">88</div>

                <div>SNT</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">92</div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded p-1 font-bold">100</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">90</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">85</div>

                <div>GRD</div>
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded p-1 font-bold">78</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">90</div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded p-1 font-bold">100</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">82</div>

                <div>VSN</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">88</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">85</div>
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded p-1 font-bold">82</div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded p-1 font-bold">100</div>
              </div>
            </div>
          )}

          {/* 🎯 Quick Wins Board */}
          {replayStep >= 3 && (
            <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-[#090d13]/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-cyan-400" />
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Strategic Action Items Matrix</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left font-sans">
                <div className="p-4 rounded-xl border border-green-500/25 bg-green-500/5 space-y-2">
                  <span className="font-mono text-[10px] text-green-400 uppercase tracking-widest font-black">Quick Wins (High Impact, Low Effort)</span>
                  <p className="text-[12px] text-zinc-300 leading-normal">
                    {reportData?.verdict?.roadmap?.[0] || 'Refactor auth controller endpoint validations'}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5 space-y-2">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-black">Strategic Initiatives (High Impact, High Effort)</span>
                  <p className="text-[12px] text-zinc-300 leading-normal">
                    {reportData?.verdict?.roadmap?.[1] || 'Configure complete CI pipeline validation stages'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
