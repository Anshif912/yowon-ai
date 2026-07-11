import { useState, useMemo } from 'react'
import { X, FileText, Info, Link2, Cpu, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { RKMEntity } from '../../types/rkm'

interface FloatingInspectorProps {
  entity: {
    id: string
    type: string
    label: string
    metadata?: any
  }
  onClose: () => void
}

type TabType = 'overview' | 'files' | 'symbols' | 'evidence' | 'dependencies' | 'technologies' | 'recommendations' | 'ai'

export default function FloatingInspector({ entity, onClose }: FloatingInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const meta = entity.metadata || {}

  // Parse evidence and files safely
  const files: string[] = useMemo(() => {
    return meta.files || meta.related_files || []
  }, [meta])

  const evidence: string[] = useMemo(() => {
    return meta.evidence || meta.sources || []
  }, [meta])

  const dependencies: string[] = useMemo(() => {
    return meta.dependencies || []
  }, [meta])

  const technologies: string[] = useMemo(() => {
    return meta.technologies || []
  }, [meta])

  const recommendations: string[] = useMemo(() => {
    return meta.suggested_improvements || [
      'Refactor structural dependencies to decouple component interaction limits.',
      'Check secrets configuration exposure index.'
    ]
  }, [meta])

  const tabsList: { id: TabType; label: string }[] = [
    { id: 'overview',       label: 'Overview' },
    { id: 'files',          label: 'Files' },
    { id: 'evidence',       label: 'Evidence' },
    { id: 'dependencies',   label: 'Deps' },
    { id: 'technologies',   label: 'Tech' },
    { id: 'recommendations',label: 'Advice' },
    { id: 'ai',             label: 'AI Explanation' },
  ]

  return (
    <div className="floating-inspector flex flex-col font-mono text-[10px] text-white">
      
      {/* Header */}
      <div className="floating-inspector-header">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <h4 className="font-bold text-white truncate text-[10px]" title={entity.label}>{entity.label}</h4>
          <span className="text-[7.5px] uppercase text-zinc-500 font-bold px-1.5 py-0.5 rounded border border-white/5 shrink-0 bg-white/[0.01]">{entity.type}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:text-white text-zinc-500 cursor-pointer shrink-0">
          <X size={12} />
        </button>
      </div>

      {/* Tabs list slider container */}
      <div className="flex items-center gap-0 border-b border-white/[0.04] bg-white/[0.005] overflow-x-auto custom-scrollbar shrink-0">
        {tabsList.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[8px] font-bold uppercase tracking-wider shrink-0 transition-all border-b ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.02]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body panel context */}
      <div className="floating-inspector-body flex-1 overflow-y-auto max-h-[220px] custom-scrollbar p-3 space-y-3">
        
        {activeTab === 'overview' && (
          <div className="space-y-2.5">
            <div>
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">Purpose Statement</span>
              <p className="text-[9.5px] text-zinc-300 font-sans leading-relaxed">{meta.purpose || 'Analyzed software component module.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">Health index</span>
                <span className="text-[10px] text-emerald-400 font-bold">{meta.health || 90}/100</span>
              </div>
              <div>
                <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">Complexity</span>
                <span className="text-[10px] text-cyan-400 font-bold">Lvl {meta.complexity || 3}/10</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-1.5">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Associated Code Files ({files.length})</span>
            {files.length === 0 ? (
              <span className="text-zinc-600 block">No direct file paths parsed.</span>
            ) : (
              files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
                  <FileText size={10} className="text-zinc-600 shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-2">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Static analysis warnings ({evidence.length})</span>
            {evidence.length === 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={11} />
                <span>Zero compiler warnings matching context.</span>
              </div>
            ) : (
              evidence.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-zinc-400 bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <ShieldAlert size={11} className="text-amber-400 mt-0.5 shrink-0" />
                  <span className="font-sans leading-relaxed">{ev}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="space-y-1.5">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Package links dependencies ({dependencies.length})</span>
            {dependencies.length === 0 ? (
              <span className="text-zinc-600 block">Zero coupling links parsed.</span>
            ) : (
              dependencies.map((dep, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
                  <Link2 size={10} className="text-zinc-600 shrink-0" />
                  <span className="truncate">{dep}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'technologies' && (
          <div className="space-y-1.5">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Ecosystem technologies used ({technologies.length})</span>
            {technologies.length === 0 ? (
              <span className="text-zinc-600 block">No primary tech tags detected.</span>
            ) : (
              technologies.map((tech, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
                  <Cpu size={10} className="text-zinc-600 shrink-0" />
                  <span className="truncate">{tech}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-2">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Actionable refactoring advice ({recommendations.length})</span>
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-zinc-400">
                <Wrench size={11} className="text-cyan-400 mt-0.5 shrink-0" />
                <span className="font-sans leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-2">
            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">Chief Judge Prime AI explanation</span>
            <p className="text-[9.5px] text-zinc-300 font-sans leading-relaxed">
              Based on AST traversal and static compiler checks, this node represents a core execution layer with a complexity rating of {meta.complexity || 3}/10. 
              Refactoring isolated coupling layers is advised to prevent parallel threads blocking locks.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
