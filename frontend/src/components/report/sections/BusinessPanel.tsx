import React from 'react';
import type { EvaluationReport } from '../../../types/report';
import { 
  DollarSign, 
  Rocket, 
  Settings, 
  Cloud, 
  Activity, 
  Briefcase,
  TrendingUp
} from 'lucide-react';
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

export default function BusinessPanel({ report }: Props) {
  const { business } = report;

  const kpiIcons: Record<string, React.ReactNode> = {
    engineeringCost: <DollarSign className="w-5 h-5 text-emerald-400" />,
    developerVelocity: <Rocket className="w-5 h-5 text-cyan-400" />,
    maintenanceCost: <Settings className="w-5 h-5 text-amber-400" />,
    scalingReadiness: <Activity className="w-5 h-5 text-purple-400" />,
    cloudReadiness: <Cloud className="w-5 h-5 text-blue-400" />,
    operationalCost: <Briefcase className="w-5 h-5 text-pink-400" />
  };

  const getGradeColor = (grade: string) => {
    switch(grade?.toUpperCase()) {
      case 'A': return 'text-emerald-400 border-emerald-400/30';
      case 'B': return 'text-cyan-400 border-cyan-400/30';
      case 'C': return 'text-amber-400 border-amber-400/30';
      case 'D': return 'text-orange-400 border-orange-400/30';
      case 'F': return 'text-red-500 border-red-500/30';
      default: return 'text-zinc-400 border-zinc-400/30';
    }
  };

  return (
    <div className="text-zinc-100 space-y-8 select-text">
      
      {/* Top row — 6 KPI metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { key: 'engineeringCost', label: 'Engineering Cost', value: business.engineeringCost },
          { key: 'developerVelocity', label: 'Developer Velocity', value: business.developerVelocity },
          { key: 'maintenanceCost', label: 'Maintenance Cost', value: business.maintenanceCost },
          { key: 'scalingReadiness', label: 'Scaling Readiness', value: business.scalingReadiness },
          { key: 'cloudReadiness', label: 'Cloud Readiness', value: business.cloudReadiness },
          { key: 'operationalCost', label: 'Operational Cost', value: business.operationalCost }
        ].map(metric => (
          <PremiumWorkspaceCard key={metric.key} accent="business" className="!p-5">
            <WorkspaceBody>
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800/80">
                  {kpiIcons[metric.key]}
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold select-none">{metric.label}</span>
                  <span className="text-lg font-display font-bold text-zinc-100 block mt-0.5">{metric.value}</span>
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle row — technical debt section */}
        <div className="lg:col-span-1 flex flex-col">
          <PremiumWorkspaceCard accent="business" className="h-full flex flex-col justify-between">
            <WorkspaceHeader title="Codebase Health" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} accent="business" />
            <WorkspaceBody className="flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-xl border flex items-center justify-center text-4xl font-display font-bold bg-zinc-900/60 select-none ${getGradeColor(business.maintainabilityGrade)}`}>
                  {business.maintainabilityGrade}
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1 font-bold select-none">Maintainability Score</span>
                  <div className="text-xl font-display font-bold mb-2 text-zinc-100">{business.maintainabilityScore}/100</div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <motion.div 
                      className={`h-full rounded-full ${business.maintainabilityScore >= 80 ? 'bg-emerald-400' : business.maintainabilityScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${business.maintainabilityScore}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide font-bold select-none">Tech Debt Days</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{business.technicalDebtDays}d</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide font-bold select-none">Repo Lifetime</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{business.repositoryLifetime}</span>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide block mb-2 font-bold select-none">Est. Refactor Cost</span>
                  {business.refactorEconomics ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-zinc-400">{business.refactorEconomics.hours} hours</span>
                        <span className="text-xs font-mono font-bold text-red-400">≈ ${business.refactorEconomics.costUsd.toLocaleString()}</span>
                      </div>
                      <div className="text-[9px] font-mono text-zinc-600 select-none">
                        {business.refactorEconomics.engineers} engineer{business.refactorEconomics.engineers > 1 ? 's' : ''} · {business.refactorEconomics.sprints} sprint{business.refactorEconomics.sprints > 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-red-400">{business.estimatedRefactorCost}</span>
                  )}
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>

        {/* KPIs table */}
        <div className="lg:col-span-2 flex flex-col">
          <PremiumWorkspaceCard accent="business">
            <WorkspaceHeader title="Key Performance Indicators" subtitle="Standardized metrics across engineering efficiency and technical debt." accent="business" />
            <WorkspaceBody>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest select-none">
                      <th className="pb-3 font-normal">Metric</th>
                      <th className="pb-3 font-normal text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {[
                      { label: 'Test Coverage', value: business.kpis.testCoverage },
                      { label: 'Maintainability Index', value: business.kpis.maintainabilityIndex },
                      { label: 'Cyclomatic Complexity', value: business.kpis.cyclomaticComplexity },
                      { label: 'Avg File Complexity', value: business.kpis.avgFileComplexity },
                      { label: 'Largest Module', value: business.kpis.largestModule },
                      { label: 'Technical Debt Ratio', value: business.kpis.technicalDebtRatio },
                      { label: 'Documentation Coverage', value: business.kpis.documentationCoverage }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="py-3 font-sans text-zinc-300">{row.label}</td>
                        <td className="py-3 font-mono font-semibold text-cyan-400 text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>
      </div>

      {/* Narrative Section - Business Implications */}
      <PremiumWorkspaceCard accent="business">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={business.dynamicNarrative} 
            defaultTitle="Business Implications Briefing"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

    </div>
  );
}
