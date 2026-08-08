import React, { useState } from 'react';
import type { EvaluationReport } from '../../../types/report';
import { Cpu, Clock, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from '../PremiumWorkspaceCard';
import StructuredNarrativeRenderer from '../StructuredNarrativeRenderer';

interface Props {
  report: EvaluationReport;
  projectId: string;
}

export default function CouncilPanel({ report, projectId }: Props) {
  const { council } = report;
  const [selectedAgentIdx, setSelectedAgentIdx] = useState(0);

  const selectedAgent = council.agents[selectedAgentIdx] || council.agents[0];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    if (score >= 70) return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
    if (score >= 50) return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    return 'text-red-400 bg-red-400/10 border-red-400/30';
  };

  const getDotColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-400';
    if (score >= 70) return 'bg-cyan-400';
    if (score >= 50) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const getRawColor = (score: number) => {
    if (score >= 85) return '#34d399';
    if (score >= 70) return '#22d3ee';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="text-zinc-100 flex flex-col gap-6 select-text">
      
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Left sidebar — Agent Roster */}
        <div className="w-full md:w-1/3 lg:w-[30%] flex flex-col">
          <PremiumWorkspaceCard accent="architecture" className="h-full flex flex-col !p-0">
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/20 select-none">
              <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center font-extrabold">
                <Cpu className="w-4 h-4 mr-2 text-purple-400" /> Agent Roster
              </h3>
            </div>
            <div className="overflow-y-auto flex-grow max-h-[480px] custom-scrollbar">
              {council.agents.map((agent, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAgentIdx(idx)}
                  className={`w-full text-left p-4 flex items-center border-b border-zinc-800/30 transition-colors ${
                    selectedAgentIdx === idx 
                      ? 'bg-purple-500/5 border-l-2 border-l-purple-400' 
                      : 'hover:bg-zinc-900/10 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mr-4 flex-shrink-0 ${getDotColor(agent.score)}`} />
                  <div className="flex-grow truncate pr-2">
                    <div className={`font-mono text-sm font-bold ${selectedAgentIdx === idx ? 'text-purple-400' : 'text-zinc-200'}`}>
                      {agent.name}
                    </div>
                    <div className="text-xs text-zinc-500 font-sans truncate">{agent.role}</div>
                  </div>
                  <div className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getScoreColor(agent.score)}`}>
                    {agent.score}
                  </div>
                </button>
              ))}
            </div>
          </PremiumWorkspaceCard>
        </div>

        {/* Right pane — Selected Agent Details */}
        <div className="w-full md:w-2/3 lg:w-[70%] flex flex-col">
          <PremiumWorkspaceCard accent="architecture" className="h-full">
            <WorkspaceBody>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-display font-extrabold text-zinc-100">{selectedAgent.name}</h2>
                  <p className="text-purple-400 font-mono text-xs mt-1 font-bold">{selectedAgent.role}</p>
                  
                  <div className="flex items-center space-x-3 mt-4 flex-wrap gap-y-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 uppercase tracking-wider font-extrabold select-none">
                      {selectedAgent.status}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 flex items-center select-none">
                      <Clock className="w-3 h-3 mr-1 text-zinc-600" /> {selectedAgent.duration}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 flex items-center gap-2 select-none">
                      <span className="text-zinc-700">·</span>
                      <span className="flex items-center"><FileText className="w-3 h-3 mr-1 text-zinc-600" />{selectedAgent.findingsCount} findings</span>
                      <span className="text-zinc-700">·</span>
                      <span>{selectedAgent.filesAnalyzed} files</span>
                      <span className="text-zinc-700">·</span>
                      <span>{selectedAgent.symbolsProcessed} symbols</span>
                    </span>
                  </div>
                </div>
                
                {/* Radial progress for agent score */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center select-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1c1e" strokeWidth="5" />
                    <motion.circle 
                      cx="50" cy="50" r="42" fill="none" 
                      stroke={getRawColor(selectedAgent.score)} strokeWidth="5"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * selectedAgent.score) / 100}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * selectedAgent.score) / 100 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-display font-extrabold" style={{ color: getRawColor(selectedAgent.score) }}>
                      {selectedAgent.score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Narrative Summary */}
              <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 mb-6">
                <p className="text-zinc-300 text-sm leading-relaxed font-sans">{selectedAgent.summary}</p>
              </div>

              {/* Dimension scores */}
              <div className="mb-6">
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold mb-3 select-none">Dimension Scores</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedAgent.dimensionScores).map(([dim, score]) => (
                    <div key={dim} className="flex flex-col">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-zinc-400 capitalize">{dim}</span>
                        <span className="text-zinc-200">{score}/100</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: getRawColor(Number(score)) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-emerald-950/20">
                  <h4 className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold mb-3 flex items-center select-none">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Key Highlights
                  </h4>
                  <ul className="space-y-2">
                    {selectedAgent.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start leading-relaxed">
                        <span className="text-emerald-500 mr-2 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-amber-950/20">
                  <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-extrabold mb-3 flex items-center select-none">
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Identified Gaps
                  </h4>
                  <ul className="space-y-2">
                    {selectedAgent.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex items-start leading-relaxed">
                        <span className="text-amber-500 mr-2 mt-0.5">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation Strip */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl mb-6">
                <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-extrabold mb-2 flex items-center select-none">
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Directive Action
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed font-sans">{selectedAgent.recommendation}</p>
              </div>

              {/* Intelligence sources */}
              <div>
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold mb-3 select-none">Intelligence Source Signals</h4>
                <div className="flex flex-wrap gap-2 select-none">
                  {selectedAgent.intelligenceSources.map((source, i) => (
                    <div key={i} className="flex items-center text-xs font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${source.available ? 'bg-emerald-400' : 'bg-red-500'} mr-2`} />
                      {source.label}
                    </div>
                  ))}
                </div>
              </div>

            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>
      </div>

      {/* Narrative Section - Consensus Reasoning */}
      <PremiumWorkspaceCard accent="architecture">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={council.dynamicNarrative} 
            defaultTitle="AI Council Consensus Report"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {/* Consensus Breakdown */}
      {report.council.agentAgreement?.length > 0 && (
        <PremiumWorkspaceCard accent="architecture">
          <WorkspaceHeader title="Agent Agreement & Calibration" subtitle="Consensus levels and alignment vectors across the evaluation council." accent="architecture" />
          <WorkspaceBody>
            <div className="flex flex-wrap gap-3 mb-4 select-none">
              {report.council.agentAgreement.map((a, i) => (
                <div key={i} className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-mono ${a.agreed ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-amber-800/40 bg-amber-950/10'}`}>
                  <span className={a.agreed ? 'text-emerald-400' : 'text-amber-400'}>{a.agreed ? '✓' : '⚠'}</span>
                  <span className="text-zinc-300">{a.agentName}</span>
                  <span className={`font-bold ${a.agreed ? 'text-emerald-400' : 'text-amber-400'}`}>{a.score}</span>
                </div>
              ))}
            </div>
            {report.council.divergenceExplanation && (
              <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-3">{report.council.divergenceExplanation}</p>
            )}
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      )}

    </div>
  );
}
