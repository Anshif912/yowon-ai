import React from 'react';
import type { EvaluationReport } from '../../../types/report';
import { Lightbulb, Rocket, Zap, Crown, Flame, Cpu, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from '../PremiumWorkspaceCard';
import StructuredNarrativeRenderer from '../StructuredNarrativeRenderer';

interface Props {
  report: EvaluationReport;
}

export default function InnovationPanel({ report }: Props) {
  const { innovation } = report;

  const scoreRings = [
    { label: 'Innovation Index', value: innovation.score, color: '#ec4899', twColor: 'text-pink-400' },
    { label: 'Novelty Score', value: innovation.noveltyScore, color: '#8b5cf6', twColor: 'text-violet-400' },
    { label: 'Differentiation', value: innovation.differentiationScore, color: '#22d3ee', twColor: 'text-cyan-400' }
  ];

  const getTechColor = (tech: string) => {
    const t = tech.toLowerCase();
    if (t.includes('react') || t.includes('vue') || t.includes('angular')) return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10';
    if (t.includes('node') || t.includes('python') || t.includes('go')) return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
    if (t.includes('aws') || t.includes('gcp') || t.includes('azure') || t.includes('docker')) return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
    if (t.includes('db') || t.includes('sql') || t.includes('mongo') || t.includes('redis')) return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    if (t.includes('ai') || t.includes('ml') || t.includes('tensor') || t.includes('gpt')) return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
    return 'text-zinc-300 border-zinc-800 bg-zinc-900/60';
  };

  return (
    <div className="text-zinc-100 space-y-8 select-text">
      
      {/* Top — Three score rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoreRings.map((ring, idx) => (
          <PremiumWorkspaceCard key={idx} accent="innovation">
            <WorkspaceBody className="flex flex-col items-center justify-center py-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold mb-4 select-none">{ring.label}</span>
              <div className="relative w-28 h-28 flex items-center justify-center select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1c1e" strokeWidth="5" />
                  <motion.circle 
                    cx="50" cy="50" r="42" fill="none" 
                    stroke={ring.color} strokeWidth="5"
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * ring.value) / 100}
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * ring.value) / 100 }}
                    transition={{ duration: 1.0, ease: "easeOut", delay: idx * 0.1 }}
                  />
                </svg>
                <span className={`absolute text-2xl font-display font-extrabold ${ring.twColor}`}>
                  {ring.value}
                </span>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Middle — Tech stack grid */}
        <div className="flex flex-col">
          <PremiumWorkspaceCard accent="innovation">
            <WorkspaceHeader title="Technology Stack" icon={<Code2 className="w-4 h-4 text-pink-400" />} accent="innovation" />
            <WorkspaceBody>
              <div className="flex flex-wrap gap-2.5">
                {innovation.technologyStack.map((tech, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-mono border ${getTechColor(tech)}`}>
                    {tech}
                  </span>
                ))}
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>

        {/* Modern Practices */}
        <div className="flex flex-col">
          <PremiumWorkspaceCard accent="innovation">
            <WorkspaceHeader title="Modern Practices" icon={<Flame className="w-4 h-4 text-orange-400" />} accent="innovation" />
            <WorkspaceBody>
              <div className="flex flex-wrap gap-2 select-none">
                {innovation.modernPractices.map((practice, i) => (
                  <div key={i} className="flex items-center text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-300">
                    <Zap className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                    {practice}
                  </div>
                ))}
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>

      </div>

      {/* Innovation deep dive */}
      <PremiumWorkspaceCard accent="innovation">
        <WorkspaceHeader title="Innovation Assessment" subtitle="Deep-dive analysis on technology uniqueness and stack differentiation." accent="innovation" />
        <WorkspaceBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <span className="flex items-center text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold mb-2 select-none">
                  <Cpu className="w-3 h-3 mr-2 text-purple-400" /> AI Usage Context
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans bg-zinc-900/60 p-4 rounded-xl border border-purple-900/20">
                  {innovation.aiUsage}
                </p>
              </div>
              <div>
                <span className="flex items-center text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold mb-2 select-none">
                  <Lightbulb className="w-3 h-3 mr-2 text-emerald-400" /> Architecture Originality
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans bg-zinc-900/60 p-4 rounded-xl border border-emerald-900/20">
                  {innovation.architectureOriginality}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <span className="flex items-center text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-2 select-none">
                  <Crown className="w-3 h-3 mr-2 text-amber-400" /> Competitive Comparison
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans bg-zinc-900/60 p-4 rounded-xl border border-amber-900/20">
                  {innovation.competitiveComparison}
                </p>
              </div>
              <div>
                <span className="flex items-center text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold mb-2 select-none">
                  <Rocket className="w-3 h-3 mr-2 text-blue-400" /> Open Source Quality
                </span>
                <p className="text-xs text-zinc-350 leading-relaxed font-sans bg-zinc-900/60 p-4 rounded-xl border border-blue-900/20">
                  {innovation.openSourceQuality}
                </p>
              </div>
            </div>
          </div>
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {innovation.peerComparison && (
        <PremiumWorkspaceCard accent="innovation">
          <WorkspaceHeader 
            title={`Peer Comparison — ${innovation.peerComparison.category}`} 
            subtitle="How this codebase compares to peers in the ecosystem." 
            icon={<Crown className="w-4 h-4 text-amber-400" />}
            accent="innovation"
          />
          <WorkspaceBody>
            <div className="flex flex-wrap gap-2 mb-6 select-none">
              {innovation.peerComparison.peers.map((peer, i) => (
                <span key={i} className="text-xs font-mono px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">{peer}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6 select-none">
              {[
                { label: 'Innovation', value: innovation.peerComparison.innovationPercentile, color: 'text-cyan-400' },
                { label: 'Architecture', value: innovation.peerComparison.architecturePercentile, color: 'text-purple-400' },
                { label: 'Testing', value: innovation.peerComparison.testingPercentile, color: 'text-amber-400' }
              ].map((metric, i) => (
                <div key={i} className="text-center bg-zinc-900/40 py-4 rounded-xl border border-zinc-800/80">
                  <div className={`text-xl font-display font-extrabold ${metric.color}`}>
                    Top {100 - metric.value}%
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider font-bold">{metric.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">{innovation.peerComparison.summary}</p>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      )}

      {/* Narrative Section - Innovation Assessment */}
      <PremiumWorkspaceCard accent="innovation">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={innovation.dynamicNarrative || innovation.narrative} 
            defaultTitle="Innovation Analysis Narrative"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

    </div>
  );
}
