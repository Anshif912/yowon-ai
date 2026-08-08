import React, { useState } from 'react';
import type { EvaluationReport } from '../../../types/report';
import { Target, Activity, ShieldAlert, AlertCircle } from 'lucide-react';
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

export default function RiskMatrixPanel({ report }: Props) {
  const { risk } = report;
  const { riskMatrix } = risk;
  
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  const severityColors = {
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/30 fill-red-500 stroke-red-500',
    HIGH: 'text-orange-400 bg-orange-400/10 border-orange-400/30 fill-orange-400 stroke-orange-400',
    MEDIUM: 'text-amber-400 bg-amber-400/10 border-amber-400/30 fill-amber-400 stroke-amber-400',
    LOW: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30 fill-cyan-400 stroke-cyan-400',
    INFORMATIONAL: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30 fill-zinc-500 stroke-zinc-500'
  };

  const getSeverityStyle = (severity: string) => severityColors[severity as keyof typeof severityColors] || severityColors.INFORMATIONAL;

  const counts = {
    CRITICAL: riskMatrix.filter(r => r.severity === 'CRITICAL').length,
    HIGH: riskMatrix.filter(r => r.severity === 'HIGH').length,
    MEDIUM: riskMatrix.filter(r => r.severity === 'MEDIUM').length,
    LOW: riskMatrix.filter(r => r.severity === 'LOW').length,
  };

  // Matrix coordinate mapping (1-5 scale)
  const mapToGrid = (val: number, max: number = 5) => {
    const clamped = Math.max(1, Math.min(max, val));
    return (clamped - 1) * 100 + 50;
  };

  return (
    <div className="text-zinc-100 flex flex-col space-y-8 select-text">
      
      {/* Top Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <PremiumWorkspaceCard accent="security" className="h-full flex items-center">
            <WorkspaceBody>
              <div className="flex flex-col justify-center relative overflow-hidden py-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold select-none">Overall Risk Score</span>
                <div className="text-4xl font-display font-extrabold text-zinc-100">
                  {risk.overallRiskScore}
                  <span className="text-sm font-sans text-zinc-500 ml-2 font-normal">/100</span>
                </div>
                <div className={`mt-3 inline-flex items-center text-xs font-mono uppercase px-2 py-0.5 rounded border w-fit font-bold select-none ${getSeverityStyle(risk.riskLevel)}`}>
                  {risk.riskLevel} RISK
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>

        <div className="col-span-3">
          <PremiumWorkspaceCard accent="security" className="h-full flex items-center">
            <WorkspaceBody>
              <div className="w-full grid grid-cols-4 gap-4 py-1 select-none">
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-red-500/20">
                  <span className="text-2xl font-display font-bold text-red-500">{counts.CRITICAL}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">Critical</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-orange-400/20">
                  <span className="text-2xl font-display font-bold text-orange-400">{counts.HIGH}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">High</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-amber-400/20">
                  <span className="text-2xl font-display font-bold text-amber-400">{counts.MEDIUM}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">Medium</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 rounded-xl border border-cyan-400/20">
                  <span className="text-2xl font-display font-bold text-cyan-400">{counts.LOW}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">Low</span>
                </div>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left (60%) — SVG Risk Matrix */}
        <div className="w-full lg:w-[60%] flex flex-col">
          <PremiumWorkspaceCard accent="security" className="h-full">
            <WorkspaceHeader title="Threat Landscape Matrix" subtitle="Likelihood and severity matrix calibration." icon={<Target className="w-4 h-4 text-orange-400" />} accent="security" />
            <WorkspaceBody className="flex flex-col items-center justify-center py-4">
              <div className="relative w-full max-w-[420px] aspect-square flex">
                {/* Y-Axis Label */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap select-none font-bold">
                  Impact (Severity)
                </div>
                
                <div className="w-full h-full relative grid grid-cols-5 grid-rows-5 border-l border-b border-zinc-700/80">
                  {/* Background zones */}
                  {Array.from({length: 25}).map((_, i) => {
                    const x = i % 5;
                    const y = 4 - Math.floor(i / 5);
                    let zoneColor = 'bg-emerald-950/5';
                    if (x + y >= 4) zoneColor = 'bg-amber-950/5';
                    if (x + y >= 6) zoneColor = 'bg-red-950/5';
                    
                    return (
                      <div key={i} className={`border-r border-t border-zinc-800/40 ${zoneColor}`} />
                    );
                  })}

                  {/* Grid Labels */}
                  <div className="absolute -bottom-6 w-full flex justify-between px-4 text-[9px] font-mono text-zinc-500 select-none font-bold">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                  <div className="absolute -left-6 h-full flex flex-col justify-between py-4 text-[9px] font-mono text-zinc-500 select-none font-bold">
                    <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
                  </div>

                  {/* Data Points */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 500 500">
                    {riskMatrix.map((item) => {
                      const xPos = mapToGrid(item.x);
                      const yPos = 500 - mapToGrid(item.y);

                      const duplicates = riskMatrix.filter(r => r.x === item.x && r.y === item.y);
                      const myIndex = duplicates.findIndex(r => r.id === item.id);
                      const offsetX = duplicates.length > 1 ? (myIndex - (duplicates.length-1)/2) * 14 : 0;
                      const offsetY = duplicates.length > 1 ? (myIndex % 2 === 0 ? 9 : -9) : 0;

                      const isSelected = selectedRiskId === item.id;

                      return (
                        <g key={item.id} className="pointer-events-auto cursor-pointer" 
                           onClick={() => setSelectedRiskId(item.id)}
                           onMouseEnter={() => setSelectedRiskId(item.id)}>
                          {isSelected && (
                            <circle cx={xPos + offsetX} cy={yPos + offsetY} r={24} className="fill-white/5 animate-pulse" />
                          )}
                          <circle 
                            cx={xPos + offsetX} 
                            cy={yPos + offsetY} 
                            r={isSelected ? 16 : 12} 
                            className={`${severityColors[item.severity as keyof typeof severityColors].split(' ')[3]} opacity-85 transition-all`} 
                            strokeWidth={isSelected ? 2 : 1}
                            stroke="#0c1017"
                          />
                          <text x={xPos + offsetX} y={yPos + offsetY} textAnchor="middle" dominantBaseline="central" 
                                className="fill-zinc-950 text-[9px] font-bold font-mono pointer-events-none">
                            {item.category.substring(0, 2).toUpperCase()}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedRiskId(null)} />
                </div>
                
                {/* X-Axis Label */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap select-none font-bold">
                  Likelihood (Probability)
                </div>
              </div>
              
              <div className="mt-14 w-full text-[9px] font-mono text-zinc-500 flex justify-center space-x-6 select-none font-bold">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"/> Critical</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-orange-400 mr-2"/> High</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-400 mr-2"/> Medium</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-cyan-400 mr-2"/> Low</span>
              </div>
            </WorkspaceBody>
          </PremiumWorkspaceCard>
        </div>

        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          {/* Threat Intelligence Feed */}
          <div className="flex-grow flex flex-col">
            <PremiumWorkspaceCard accent="security">
              <WorkspaceHeader title="Threat Intelligence Feed" icon={<Activity className="w-4 h-4 text-cyan-400" />} accent="security" />
              <WorkspaceBody className="overflow-y-auto max-h-72 custom-scrollbar">
                <div className="space-y-3.5">
                  {risk.threatFeed?.length > 0 ? risk.threatFeed.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs font-mono">
                      <span className="text-zinc-600 whitespace-nowrap">{event.timestamp}</span>
                      <span className={`font-bold whitespace-nowrap ${
                        event.agent === 'Sentinel' ? 'text-red-400' :
                        event.agent === 'Forge' ? 'text-blue-400' :
                        event.agent === 'Guardian' ? 'text-amber-400' :
                        event.agent === 'Prime' ? 'text-purple-400' : 'text-cyan-400'
                      }`}>{event.agent}</span>
                      <span className="text-zinc-300">{event.message}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-zinc-500 font-sans">No threat events recorded for this evaluation.</p>
                  )}
                </div>
              </WorkspaceBody>
            </PremiumWorkspaceCard>
          </div>

          {/* Selected Risk Drawer */}
          {selectedRiskId && (() => {
            const item = riskMatrix.find(r => r.id === selectedRiskId);
            if (!item) return null;
            return (
              <div className="flex flex-col">
                <PremiumWorkspaceCard accent="security" className="border-l-4 border-l-orange-400">
                  <WorkspaceBody>
                    <div className="flex justify-between items-start mb-4 select-none">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Risk Detail</span>
                      <button onClick={() => setSelectedRiskId(null)} className="text-zinc-500 hover:text-zinc-300 text-xs font-mono font-bold">CLOSE ×</button>
                    </div>
                    <h4 className="text-base font-bold text-zinc-100 mb-2 leading-snug">{item.riskName}</h4>
                    <div className={`text-[10px] font-mono px-2 py-0.5 rounded border w-fit mb-4 font-bold select-none ${getSeverityStyle(item.severity)}`}>{item.severity}</div>
                    
                    {item.reason && (
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 mb-3">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1 font-bold select-none">Reason</span>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">{item.reason}</p>
                      </div>
                    )}
                    <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 mb-3">
                      <span className="text-[9px] font-mono text-cyan-400 uppercase block mb-1 font-bold select-none">Recommended Fix</span>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">{item.recommendedFix}</p>
                    </div>
                    {item.affectedFiles?.length > 0 && (
                      <div className="mb-3">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-2 font-bold select-none">Affected Files</span>
                        {item.affectedFiles.map((f, i) => (
                          <div key={i} className="text-xs font-mono text-zinc-400 bg-zinc-900/60 px-2 py-1 rounded mb-1 border border-zinc-800">{f}</div>
                        ))}
                      </div>
                    )}
                  </WorkspaceBody>
                </PremiumWorkspaceCard>
              </div>
            );
          })()}
        </div>

      </div>

      {/* Narrative Section - Risk Overview */}
      <PremiumWorkspaceCard accent="security">
        <WorkspaceBody>
          <StructuredNarrativeRenderer 
            narrative={risk.dynamicNarrative} 
            defaultTitle="Risk Analysis & Security Narrative"
          />
        </WorkspaceBody>
      </PremiumWorkspaceCard>

    </div>
  );
}
