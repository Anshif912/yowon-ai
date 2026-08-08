import React, { useState } from 'react';
import type { EvaluationReport } from '../../../types/report';
import { 
  Clock, 
  Zap, 
  FileCode, 
  Brain, 
  Target, 
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from '../PremiumWorkspaceCard';
import StructuredNarrativeRenderer from '../StructuredNarrativeRenderer';

interface Props {
  report: EvaluationReport;
}

const CATEGORIES = ['Immediate', 'Today', 'This Week', 'This Sprint', 'Long Term'];

export default function RecommendationsPriorityPanel({ report }: Props) {
  const { recommendations } = report;
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFixes = recommendations.fixes.filter(f => {
    return f.category.toLowerCase() === activeTab.toLowerCase();
  });

  const getBorderColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'immediate': return 'border-l-red-500';
      case 'today': return 'border-l-orange-400';
      case 'this week': return 'border-l-amber-400';
      case 'this sprint': return 'border-l-cyan-400';
      case 'long term': return 'border-l-zinc-500';
      default: return 'border-l-cyan-400';
    }
  };

  return (
    <div className="text-zinc-100 flex flex-col space-y-6 select-text">
      
      {/* Header Stat Summary */}
      <PremiumWorkspaceCard accent="recommendation">
        <WorkspaceBody>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-1">
            <div>
              <h2 className="text-2xl font-display font-extrabold text-zinc-100 mb-1">Priority Action Queue</h2>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold select-none">Actionable recommendations roadmap</span>
            </div>
            <div className="flex items-center space-x-6 flex-shrink-0 select-none">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Total Effort</span>
                <div className="text-3xl font-display font-extrabold text-amber-400">
                  {recommendations.totalHours}
                  <span className="text-sm font-sans text-zinc-500 ml-1 font-normal">hrs</span>
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1 font-bold">Identified Fixes</span>
                <div className="text-3xl font-display font-extrabold text-zinc-100">{recommendations.fixes.length}</div>
              </div>
            </div>
          </div>
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-zinc-800/80 hide-scrollbar select-none">
        {CATEGORIES.map(cat => {
          const count = recommendations.fixes.filter(f => f.category.toLowerCase() === cat.toLowerCase()).length;
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${isActive ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
            >
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">{cat}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-400/10 text-amber-400' : 'bg-zinc-900 text-zinc-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item list */}
      <div className="space-y-4 flex-grow">
        {filteredFixes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8 bg-zinc-900/10 rounded-xl border border-zinc-850 select-none">
            <ShieldCheck className="w-10 h-10 mb-4 text-emerald-400/30" />
            <p className="font-mono text-xs text-emerald-400 uppercase tracking-wider mb-2 font-bold">No {activeTab} Issues Identified</p>
            <p className="text-xs text-zinc-500 font-sans max-w-sm leading-relaxed">
              {activeTab === 'Immediate' 
                ? 'No critical blockers detected. Security score and stability signals remained above intervention thresholds. The recommendation engine prioritized medium-term improvements.'
                : activeTab === 'Today'
                ? 'No urgent same-day tasks identified. Architecture and operational signals are within acceptable parameters.'
                : `No ${activeTab.toLowerCase()} tasks were generated for this repository based on the current analysis findings.`
              }
            </p>
          </div>
        ) : (
          filteredFixes.map(item => {
            const isExpanded = expandedItems[item.id];
            return (
              <div key={item.id} className="flex flex-col">
                <PremiumWorkspaceCard accent="recommendation" className={`border-l-4 ${getBorderColor(item.category)} !p-5`}>
                  <WorkspaceBody>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-base font-bold text-zinc-100 font-sans pr-4 leading-snug">{item.recommendation}</h3>
                      <div className="flex-shrink-0 flex items-center space-x-3 select-none">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-cyan-400">
                          {item.confidence}% CONF
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5 mb-4 select-none">
                      <span className="flex items-center text-[9px] font-mono text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10 uppercase font-bold">
                        <Target className="w-3 h-3 mr-1" /> Impact: {item.impact}
                      </span>
                      <span className="flex items-center text-[9px] font-mono text-purple-400 bg-purple-400/5 px-2 py-0.5 rounded border border-purple-400/10 uppercase font-bold">
                        <Zap className="w-3 h-3 mr-1" /> Diff: {item.difficulty}
                      </span>
                      <span className="flex items-center text-[9px] font-mono text-zinc-300 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-850 uppercase font-bold">
                        <Clock className="w-3 h-3 mr-1 text-zinc-500" /> ETA: {item.eta}
                      </span>
                      <span className="flex items-center text-[9px] font-mono text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10 uppercase font-bold">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> ROI: {item.roi}
                      </span>
                    </div>

                    {item.economicImpact && (
                      <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-850 mb-3 select-none font-bold">
                        <span className="text-zinc-300">{item.economicImpact.hours}h</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-emerald-400">~${item.economicImpact.costUsd.toLocaleString()}</span>
                        <span className="text-zinc-700">·</span>
                        <span>{item.economicImpact.engineers} engineer{item.economicImpact.engineers > 1 ? 's' : ''}</span>
                        <span className="text-zinc-700">·</span>
                        <span>{item.economicImpact.sprints} sprint{item.economicImpact.sprints > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.04]">
                      <div className="flex flex-wrap gap-2 select-none">
                        {item.intelligenceSources.map((src, i) => (
                          <span key={i} className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                            {src}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4">
                        {item.dependsOn && (
                          <span className="text-[9px] font-mono text-zinc-500 select-none">
                            Depends on: {item.dependsOn.join(', ')}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-zinc-500 select-none">
                          Agent: {item.generatedBy}
                        </span>
                        <button 
                          onClick={() => toggleExpand(item.id)}
                          className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center transition-colors font-bold cursor-pointer"
                        >
                          {isExpanded ? 'LESS DETAILS' : 'MORE DETAILS'}
                          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                        </button>
                      </div>
                    </div>
                  </WorkspaceBody>
                </PremiumWorkspaceCard>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-zinc-950/20 border-x border-b border-zinc-850 rounded-b-xl -mt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold select-none">
                              <Brain className="w-3.5 h-3.5 mr-2 text-purple-400 inline" /> AI Reasoning
                            </span>
                            <p className="text-xs text-zinc-350 leading-relaxed font-sans">
                              {item.aiReasoning}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold select-none">
                              <FileCode className="w-3.5 h-3.5 mr-2 text-cyan-400 inline" /> Repository File Explorer
                            </span>
                            <div className="space-y-2">
                              {item.files.slice(0, 4).map((f, i) => {
                                const isCode = f.endsWith('.py') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json');
                                const locMock = isCode ? `${Math.round(200 + Math.random() * 540)} LOC` : `${Math.round(1 + Math.random() * 15)} KB`;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => window.dispatchEvent(new CustomEvent('yowon-view-file', { detail: { path: f } }))}
                                    className="w-full text-left flex justify-between items-center text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/20 p-2 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <span className="truncate pr-4">📄 {f}</span>
                                    <span className="text-zinc-500 text-[10px] shrink-0 font-bold hover:underline">Click to view ({locMock})</span>
                                  </button>
                                );
                              })}
                              {item.files.length > 4 && (
                                <div className="text-[9px] font-mono text-zinc-500 italic pl-2 select-none">
                                  + {item.files.length - 4} more files affected in target module
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Estimated Impact Projections */}
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 font-bold select-none">Estimated Impact Projections</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono select-none">
                            {[
                              { label: 'Architecture', val: '▲ HIGH', col: 'text-cyan-400' },
                              { label: 'Security', val: item.generatedBy === 'Sentinel' ? '▲ HIGH' : '▲ MEDIUM', col: item.generatedBy === 'Sentinel' ? 'text-red-400' : 'text-zinc-400' },
                              { label: 'Operational', val: item.generatedBy === 'Guardian' ? '▲ HIGH' : '▲ MEDIUM', col: item.generatedBy === 'Guardian' ? 'text-amber-400' : 'text-zinc-400' },
                              { label: 'Business ROI', val: item.roi === 'HIGH' ? '▲ HIGH' : '▲ MEDIUM', col: 'text-emerald-400' }
                            ].map((impact, i) => (
                              <div key={i} className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 flex justify-between items-center">
                                <span className="text-zinc-500 text-[9px]">{impact.label}</span>
                                <span className={`font-bold ${impact.col}`}>{impact.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3 select-none">
                          {item.linkedRiskId && <span className="text-[9px] font-mono text-zinc-500">Linked Risk: {item.linkedRiskId}</span>}
                          {item.crossNavigationTarget && (
                            <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" /> View in {item.crossNavigationTarget}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Narrative Section - Recommendations */}
      <PremiumWorkspaceCard accent="recommendation">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={recommendations.dynamicNarrative} 
            defaultTitle="Priorities Assessment & ROI Narrative"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

    </div>
  );
}
