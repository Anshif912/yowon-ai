import React from 'react';
import type { EvaluationReport } from '../../../types/report';
import { ShieldCheck, ShieldAlert, Shield, Activity, Target, Zap, FileText } from 'lucide-react';
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from '../PremiumWorkspaceCard';
import StructuredNarrativeRenderer from '../StructuredNarrativeRenderer';

interface Props {
  report: EvaluationReport;
}

export default function VerdictPanel({ report }: Props) {
  const { executive } = report;
  const breakdown = executive.confidenceBreakdown;

  const getDecisionColor = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'APPROVE': return 'text-emerald-400';
      case 'REJECT': return 'text-red-400';
      case 'CONDITIONAL_APPROVE': return 'text-amber-400';
      default: return 'text-cyan-400';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'APPROVE': return <ShieldCheck className="w-12 h-12 text-emerald-400" />;
      case 'REJECT': return <ShieldAlert className="w-12 h-12 text-red-400" />;
      case 'CONDITIONAL_APPROVE': return <Shield className="w-12 h-12 text-amber-400" />;
      default: return <Shield className="w-12 h-12 text-cyan-400" />;
    }
  };

  const dimensions = [
    { label: 'Overall', value: breakdown.overall },
    { label: 'Architecture', value: breakdown.architecture },
    { label: 'Security', value: breakdown.security },
    { label: 'Business', value: breakdown.business },
    { label: 'Innovation', value: breakdown.innovation },
    { label: 'Performance', value: breakdown.performance }
  ];

  return (
    <div className="min-h-screen text-zinc-100 space-y-8 select-text">
      
      {/* Top section — Decision card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <PremiumWorkspaceCard accent="executive">
            <WorkspaceBody>
              <div className="flex items-center space-x-6 py-2">
                <div className="flex-shrink-0">
                  {getDecisionIcon(executive.decision)}
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Consensus Verdict Decision</span>
                  <h2 className={`text-4xl font-display font-extrabold tracking-tight mb-2 uppercase ${getDecisionColor(executive.decision)}`}>
                    {executive.decision.replace('_', ' ')}
                  </h2>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex-grow bg-zinc-900 rounded-full h-3 border border-zinc-800/80 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          executive.decision === 'APPROVE' ? 'bg-emerald-400' :
                          executive.decision === 'REJECT' ? 'bg-red-400' :
                          'bg-amber-400'
                        }`} 
                        style={{ width: `${executive.confidence}%` }} 
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-400">{executive.confidence}% CONFIDENCE RATING</span>
                  </div>
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>
        
        <div className="col-span-1 flex flex-col space-y-4">
          <PremiumWorkspaceCard accent="executive" className="flex-grow">
            <WorkspaceBody>
              <div className="flex flex-col justify-center h-full">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Production Readiness</span>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span className="font-display text-xl font-bold text-zinc-100">{executive.productionReadiness.indicator}</span>
                </div>
                <p className="text-xs text-zinc-400">{executive.productionReadiness.status}</p>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>

          <PremiumWorkspaceCard accent="executive" className="h-28 flex items-center">
            <WorkspaceBody>
              <div className="flex flex-col justify-center h-full">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Risk Level</span>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  <span className="font-display text-xl font-bold text-zinc-100 uppercase">{executive.riskLevel}</span>
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>
      </div>

      {/* Confidence Propagation breakdown */}
      <PremiumWorkspaceCard accent="executive">
        <WorkspaceHeader 
          title="Confidence Assessment" 
          subtitle="Bayesian alignment of specialist confidence ratings across report dimensions."
          icon={<Zap className="w-4 h-4" />}
          accent="executive"
        />
        <WorkspaceBody>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-6">
            {dimensions.map(dim => (
              <div key={dim.label} className="flex flex-col">
                <span className="text-xs font-mono text-zinc-400 mb-2">{dim.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-mono text-zinc-100 font-bold">{dim.value}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 mt-2 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full rounded-full bg-cyan-400" 
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-sans leading-relaxed">
            {breakdown.reasoning}
          </div>
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {executive.scoreWeights?.length > 0 && (
        <PremiumWorkspaceCard accent="executive">
          <WorkspaceHeader 
            title="Score Explainability" 
            subtitle="Breakdown of weights applied to dimension scores for the overall calibration."
            accent="executive"
          />
          <WorkspaceBody>
            <div className="space-y-3">
              {executive.scoreWeights.map((w, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs font-mono text-zinc-400 w-28">{w.dimension}</span>
                  <span className="text-xs font-mono text-zinc-600 w-10">{Math.round(w.weight * 100)}%</span>
                  <div className="flex-grow h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${w.rawScore}%` }} />
                  </div>
                  <span className="text-xs font-mono text-zinc-300 w-8 text-right">{w.rawScore}</span>
                  <span className="text-xs font-mono text-zinc-600 w-4">×</span>
                  <span className="text-xs font-mono text-zinc-500 w-6">{Math.round(w.weight * 100)}%</span>
                  <span className="text-xs font-mono text-cyan-400 w-10 text-right font-bold">={w.weightedScore}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 border-t border-zinc-800 pt-3">
                <span className="text-xs font-mono text-zinc-400 w-28">Overall</span>
                <span className="text-xs font-mono text-zinc-600 w-10">100%</span>
                <div className="flex-grow" />
                <span className="text-sm font-mono font-bold text-zinc-100">{report.overallScore}/100</span>
              </div>
            </div>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      )}

      {/* Narrative Section - Core Intelligence Briefing */}
      <PremiumWorkspaceCard accent="executive">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={executive.dynamicNarrative || executive.executiveSummary} 
            defaultTitle="Verdict Executive Narrative"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {executive.ceoSummary && (
        <PremiumWorkspaceCard accent="executive">
          <WorkspaceBody>
            {/* Memorandum Header */}
            <div className="border-b border-zinc-800/80 pb-4 mb-6 flex justify-between items-center select-none">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest font-bold">Evaluation Memorandum</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Internal ID: YW-{report.projectId.substring(0, 8).toUpperCase()}</span>
            </div>

            {/* Memorandum Header Fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono mb-6 border-b border-zinc-800/60 pb-5 select-none">
              <div>
                <span className="text-zinc-500 block mb-1">TO</span>
                <span className="text-zinc-200 font-bold">Architecture Review Committee</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">FROM</span>
                <span className="text-zinc-200 font-bold">Chief Agent (Prime Consensus Node)</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">DATE</span>
                <span className="text-zinc-200 font-bold">
                  {new Date(report.metadata.generatedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">SECURITY CLEARANCE</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  executive.decision === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  executive.decision === 'REJECT' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>{executive.decision.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Memorandum Body */}
            <div className="space-y-4 text-sm text-zinc-200 font-sans leading-relaxed">
              <p>{executive.ceoSummary}</p>
            </div>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      )}

      {/* 2-col grid for Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PremiumWorkspaceCard accent="business">
          <WorkspaceHeader title="Key Strengths" subtitle="Positive architecture and operations signals." accent="business" />
          <WorkspaceBody>
            <ul className="space-y-3">
              {executive.topStrengths.map((strength, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-emerald-400 mr-3 mt-1">●</span>
                  <span className="text-zinc-300 text-sm leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </WorkspaceBody>
        </PremiumWorkspaceCard>

        <PremiumWorkspaceCard accent="recommendation">
          <WorkspaceHeader title="Key Weaknesses" subtitle="Suppression vectors requiring review." accent="recommendation" />
          <WorkspaceBody>
            <ul className="space-y-3">
              {executive.topWeaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-amber-400 mr-3 mt-1">●</span>
                  <span className="text-zinc-300 text-sm leading-relaxed">{weakness}</span>
                </li>
              ))}
            </ul>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      </div>

      {/* Bottom info strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumWorkspaceCard accent="executive">
          <WorkspaceBody>
            <div className="grid grid-cols-2 gap-6 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">Deployment Advice</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{executive.deploymentAdvice}</p>
              </div>
              <div className="flex flex-col border-l border-zinc-800/80 pl-6">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">Est. Remediation Effort</span>
                <p className="text-3xl font-display font-extrabold text-cyan-400">
                  {executive.estimatedEngineeringHours}
                  <span className="text-lg text-zinc-500 font-mono font-bold">h</span>
                </p>
              </div>
            </div>
          </WorkspaceBody>
        </PremiumWorkspaceCard>

        {executive.productionChecklist?.length > 0 && (
          <PremiumWorkspaceCard accent="executive">
            <WorkspaceHeader title="Production Checklist" subtitle="Minimum readiness requirements verification." accent="executive" />
            <WorkspaceBody>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {executive.productionChecklist.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-mono ${
                    item.passed ? 'border-emerald-800/30 bg-emerald-950/10 text-emerald-400' : 'border-red-800/30 bg-red-950/10 text-red-400'
                  }`}>
                    <span>{item.passed ? '✓' : '✗'}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-grow h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.round((executive.productionChecklist.filter(c => c.passed).length / executive.productionChecklist.length) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-300 font-bold select-none">
                  {Math.round((executive.productionChecklist.filter(c => c.passed).length / executive.productionChecklist.length) * 100)}% Ready
                </span>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        )}
      </div>

    </div>
  );
}
