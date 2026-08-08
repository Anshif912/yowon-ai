import React from 'react';
import type { EvaluationReport } from '../../../types/report';
import { 
  Cpu, TrendingUp, Compass, CheckCircle, BarChart3, ShieldAlert, 
  Wrench, Sparkles, Activity, FileText
} from 'lucide-react';
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from '../PremiumWorkspaceCard';

interface Props {
  report: EvaluationReport;
  projectId: string;
  onNavigate: (section: string) => void;
}

function CircularProgress({ value, label }: { value: number; label: string }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center select-none">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">{label}</span>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={radius} fill="none" stroke="#18181b" strokeWidth="3.5" />
          <circle 
            cx="28" 
            cy="28" 
            r={radius} 
            fill="none" 
            stroke="#fbbf24" 
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-display font-extrabold text-zinc-100">{value}</span>
      </div>
    </div>
  );
}

function AgentConsensusWidget({ value }: { value: number }) {
  return (
    <div className="flex flex-col select-none justify-center">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">AGENT CONSENSUS</span>
      <span className="text-xl font-display font-extrabold text-zinc-100 leading-none">{value}%</span>
      <div className="w-full bg-zinc-900 h-1.5 mt-2 rounded-full overflow-hidden border border-zinc-800">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProdReadinessWidget({ status }: { status: string }) {
  const isReady = status.toLowerCase().includes('ready') || status.toLowerCase().includes('approve');
  return (
    <div className="flex flex-col select-none justify-center">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">PROD READINESS</span>
      <div className="flex items-center space-x-2 mt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full ${isReady ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
        <span className="text-sm font-mono font-bold text-zinc-200 leading-none">{status}</span>
      </div>
    </div>
  );
}

function RepoHealthWidget({ value }: { value: number }) {
  return (
    <div className="flex flex-col select-none justify-center">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">REPO HEALTH</span>
      <span className="text-xl font-display font-extrabold text-cyan-400 leading-none">{value}</span>
    </div>
  );
}

function RiskLevelWidget({ level }: { level: string }) {
  const isLow = level.toLowerCase() === 'low';
  return (
    <div className="flex flex-col select-none justify-center">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 font-bold">RISK LEVEL</span>
      <span className={`text-xl font-display font-extrabold leading-none ${isLow ? 'text-cyan-400' : 'text-red-400'}`}>{level}</span>
    </div>
  );
}

const CARDS = [
  { id: 'verdict', title: 'Executive Verdict', description: 'Review system status summaries, production clearance clearances, and health rankings.', icon: CheckCircle, accent: 'executive' },
  { id: 'performance', title: 'Performance Scorecard', description: 'Audit separation metrics, AST layers static analysis, and modularity ratings.', icon: BarChart3, accent: 'performance' },
  { id: 'ai-council', title: 'AI Council', description: 'Detailed auditor agent checkmarks, reasoning logs, and individual confidence bounds.', icon: Cpu, accent: 'architecture' },
  { id: 'risk', title: 'Risk Analysis', description: 'Inspect codebase weaknesses checklist, credentials security risks, and technical debt warnings.', icon: ShieldAlert, accent: 'security' },
  { id: 'business', title: 'Business Intelligence', description: 'Technical debt days estimations and maintainability timelines.', icon: Compass, accent: 'business' },
  { id: 'innovation', title: 'Innovation', description: 'Audits for codebase design pattern adaptations.', icon: Sparkles, accent: 'innovation' },
  { id: 'recommendations', title: 'Recommendations', description: 'Prioritized technical improvements list to increase safety score.', icon: Wrench, accent: 'recommendation' },
  { id: 'timeline', title: 'Timeline', description: 'View progress logs and evaluation milestones execution timeline.', icon: Activity, accent: 'timeline' },
  { id: 'export', title: 'Export PDF Report', description: 'Compile evaluation verdicts and security logs into an enterprise-ready PDF document.', icon: FileText, accent: 'timeline' }
];

export default function OverviewMissionControl({ report, projectId, onNavigate }: Props) {
  const { overview, executive, repository } = report;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-cyan-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const hasTests = report.executive.productionChecklist?.find(c => c.label === 'Automated Tests')?.passed ?? false;
  const hasCICD = report.executive.productionChecklist?.find(c => c.label === 'CI/CD')?.passed ?? false;
  const hasDocker = report.repository.dna.containerization !== 'Not detected' && report.repository.dna.containerization !== 'None detected';

  return (
    <div className="space-y-8 select-text">
      
      {/* ── Dashboard Scorecard & Specifications Panel ── */}
      <PremiumWorkspaceCard accent="executive">
        <WorkspaceBody>
          {/* Top Scorecard Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pb-6 border-b border-white/[0.04]">
            <CircularProgress value={report.overallScore} label="Overall Score" />
            <AgentConsensusWidget value={report.council.consensus} />
            <ProdReadinessWidget status={report.executive.productionReadiness.status} />
            <RepoHealthWidget value={report.overview.repositoryHealth} />
            <RiskLevelWidget level={report.executive.riskLevel} />
          </div>

          {/* Bottom 2-Column Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 w-full">
            
            {/* Left: REPOSITORY HEALTH DASHBOARD */}
            <div>
              <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-4 font-bold select-none">
                REPOSITORY HEALTH DASHBOARD
              </h3>
              <div className="space-y-3.5 select-none">
                {[
                  { label: 'Architecture Maturity',  score: report.council.agents.find(a => a.name === 'Forge')?.score ?? 80 },
                  { label: 'Security Posture',        score: report.security.score ?? 80 },
                  { label: 'Testing Baseline',        score: hasTests ? Math.round((report.business.maintainabilityScore ?? 80) * 0.9) : 35 },
                  { label: 'Documentation Coverage',  score: report.council.agents.find(a => a.name === 'Showcase')?.score ?? 70 },
                  { label: 'Code Maintainability',    score: report.business.maintainabilityScore ?? 80 },
                ].map((item, idx) => {
                  const filled = Math.round(item.score / 10);
                  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-500 font-bold tracking-tight">{bar}</span>
                        <span className={`font-bold w-6 text-right ${getScoreColor(item.score)}`}>{item.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: DEPENDENCY INTELLIGENCE */}
            <div>
              <h3 className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-4 font-bold select-none">
                DEPENDENCY INTELLIGENCE
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs font-mono">
                {[
                  { label: 'Language',        value: repository.dna.languages[0] || 'TypeScript' },
                  { label: 'API Framework',   value: repository.dna.frameworks.find(f => f.toLowerCase().includes('fastapi') || f.toLowerCase().includes('django')) || 'FastAPI' },
                  { label: 'SQL ORM',         value: repository.dna.database !== 'Unknown DB' ? `SQLAlchemy (${repository.dna.database})` : 'SQLAlchemy' },
                  { label: 'AI Retrieval',    value: repository.dna.aiFrameworks.includes('LangChain') || repository.dna.frameworks.some(f => f.toLowerCase().includes('langchain')) ? 'LangChain (Present)' : 'None detected' },
                  { label: 'Vector Store',    value: repository.dna.aiFrameworks.includes('FAISS') || repository.dna.frameworks.some(f => f.toLowerCase().includes('faiss')) ? 'FAISS (Present)' : 'None detected' },
                  { label: 'Containerization',value: hasDocker ? 'Docker' : 'None detected' },
                  { label: 'CI/CD Pipeline',  value: hasCICD ? 'GitHub Actions' : 'None detected' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 border-b border-white/[0.03] pb-2 last:border-0">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest select-none">{item.label}</span>
                    <span className={`font-semibold text-[11px] ${item.value.includes('None') || item.value.includes('Missing') ? 'text-red-400' : 'text-zinc-300'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WorkspaceBody>
      </PremiumWorkspaceCard>

      {/* ── Premium Bento Grid cards (navigation tiles) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <PremiumWorkspaceCard 
              key={card.id} 
              accent={card.accent as any} 
              onClick={() => onNavigate(card.id)}
              className="cursor-pointer"
            >
              <WorkspaceHeader title={card.title} icon={<Icon size={16} />} accent={card.accent as any} />
              <WorkspaceBody className="space-y-4">
                <p className="text-xs text-zinc-400 font-sans leading-relaxed min-h-[40px]">
                  {card.description}
                </p>
              </WorkspaceBody>
              <WorkspaceFooter label="Jury Gateway" actionText="Explore" accent={card.accent as any} />
            </PremiumWorkspaceCard>
          );
        })}
      </div>

    </div>
  );
}

export function YowonAIOverviewSkeleton() {
  return (
    <div className="space-y-8 p-6 bg-[#090d13] min-h-screen animate-pulse">
      <div className="bg-[#0c1017] h-[460px] rounded-[18px] border border-zinc-800" />
      <div className="bg-[#0c1017] h-24 rounded-lg border border-zinc-800" />
    </div>
  );
}
