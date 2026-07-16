import React from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  MessageSquare,
  Search,
  TrendingUp,
  Workflow,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Cpu
} from 'lucide-react'
import { PageHeader, MetricCard, ActivityTimeline, StatusBadge } from '../../components/enterprise'

export default function EnterpriseAIOverviewPage() {
  const recentDecisions = [
    {
      id: 'd1',
      title: 'Auto-Approval: PR #402 merged',
      description: 'AI Judge completed static analysis and vulnerability validation. Determinism score: 100%.',
      timestamp: '12 mins ago',
      type: 'success' as const,
      icon: Shield,
      tags: ['AI Judge', 'Security']
    },
    {
      id: 'd2',
      title: 'Risk mitigation prediction executed',
      description: 'Identified 3 potential tech debt points in node-service dependencies. Mitigations auto-queued.',
      timestamp: '1 hour ago',
      type: 'info' as const,
      icon: TrendingUp,
      tags: ['Predictions', 'Architecture']
    },
    {
      id: 'd3',
      title: 'Workflow trigger anomaly detected',
      description: 'Execution logs for Docker registry webhook displayed latency above 250ms. Rerouted.',
      timestamp: '3 hours ago',
      type: 'warning' as const,
      icon: Workflow,
      tags: ['Workflows', 'Operations']
    }
  ]

  const quickLinks = [
    {
      title: 'AI Copilot Workspace',
      desc: 'Collaborate with multi-persona AI agents covering PM, CTO, Judge, Architect, and Security roles.',
      href: '/intelligence/copilot',
      icon: MessageSquare,
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
    },
    {
      title: 'Semantic Context Search',
      desc: 'Search codebase semantic graphs, documentation context vectors, and jury rulings evidence.',
      href: '/intelligence/search',
      icon: Search,
      color: 'text-violet-400 border-violet-500/20 bg-violet-500/5'
    },
    {
      title: 'Risk & Readiness Predictions',
      desc: 'Analyze deployment risk probability, technical debt forecasts, and codebase security posture.',
      href: '/intelligence/predictions',
      icon: TrendingUp,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
    },
    {
      title: 'Org Digital Twin Simulator',
      desc: 'Simulate engineering velocity, check security alignment, and forecast delivery workloads.',
      href: '/intelligence/digital-twin',
      icon: Brain,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
    },
    {
      title: 'Workflow Studio Designer',
      desc: 'Build conditional decision flows, automate approvals, and trigger custom webhooks.',
      href: '/enterprise/workflows',
      icon: Workflow,
      color: 'text-pink-400 border-pink-500/20 bg-pink-500/5'
    },
    {
      title: 'Executive Portfolio Dashboard',
      desc: 'High-level aggregate indices covering innovation rates, technology diversity, and compliance.',
      href: '/intelligence/executive',
      icon: Layers,
      color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5'
    }
  ]

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Intelligence Hub"
        description="Unified interface for AI Copilots, Semantic Knowledge Search, Risk Predictions, Org Digital Twin models, and Workflow Studio."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Overview' }
        ]}
        status={{ label: 'AI COGNITIVE ENGINE ACTIVE', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* AI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Decision Accuracy"
            value="99.4%"
            subtext="Based on 4,120 evaluations"
            icon={Brain}
            trend={{ value: '+0.2%', direction: 'up' }}
            accentColor="cyan"
          />
          <MetricCard
            label="Predictions Generated"
            value="142 / Week"
            subtext="Readiness & Tech Debt"
            icon={TrendingUp}
            trend={{ value: '100% active', direction: 'neutral' }}
            accentColor="violet"
          />
          <MetricCard
            label="Active Automations"
            value="12 Workflows"
            subtext="Avg runtime: 12.4s"
            icon={Workflow}
            trend={{ value: '88ms avg', direction: 'up', label: 'latency' }}
            accentColor="emerald"
          />
          <MetricCard
            label="Twin Alignment"
            value="94 / 100"
            subtext="Engineering vs Security"
            icon={Sparkles}
            trend={{ value: 'Excellent', direction: 'up' }}
            accentColor="amber"
          />
        </div>

        {/* AI Workspaces Directory */}
        <div className="flex flex-col text-left">
          <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase tracking-wider mb-5">
            Intelligence workspaces
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Link
                  key={index}
                  to={link.href}
                  className="group relative flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl p-6 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Glowing line decorator */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/25 transition-all duration-300" />

                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg border ${link.color} shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 font-display">
                    {link.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium flex-1">
                    {link.desc}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Bottom Panel: Recent AI Decisions (Full Width) */}
        <div className="flex flex-col border border-white/5 bg-[#0b0c10]/40 backdrop-blur-md rounded-xl p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
          
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Recent Cognitive Decisions
              </h4>
              <p className="text-xs text-zinc-500">
                Audit feed for active automated AI judge and prediction updates
              </p>
            </div>
            <StatusBadge status="success" size="xs" customLabel="cognitive engine online" />
          </div>

          <ActivityTimeline items={recentDecisions} />
        </div>

      </div>
    </div>
  )
}
