import React from 'react'
import {
  Brain,
  MessageSquare,
  TrendingUp,
  Workflow,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Cpu,
  Coins,
  ShieldAlert,
  ListTodo
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'
import { PageHeader, MetricCard, ChartCard, ActivityTimeline, StatusBadge } from '../../components/enterprise'

// Forecasts charts data
const techDebtData = [
  { month: 'Jul 26', current: 14200, projectedNoRefactor: 14200, projectedWithAI: 14200 },
  { month: 'Aug 26', current: 13800, projectedNoRefactor: 15400, projectedWithAI: 12100 },
  { month: 'Sep 26', current: 12500, projectedNoRefactor: 16800, projectedWithAI: 10400 },
  { month: 'Oct 26', current: 11100, projectedNoRefactor: 18200, projectedWithAI: 8900 },
  { month: 'Nov 26', current: 10200, projectedNoRefactor: 19500, projectedWithAI: 7200 },
  { month: 'Dec 26', current: 9400, projectedNoRefactor: 21000, projectedWithAI: 5800 }
]

const vulnerabilitiesData = [
  { week: 'Wk 27', critical: 1, major: 4, mitigated: 3 },
  { week: 'Wk 28', critical: 0, major: 3, mitigated: 5 },
  { week: 'Wk 29', critical: 0, major: 2, mitigated: 4 },
  { week: 'Wk 30', critical: 2, major: 5, mitigated: 6 },
  { week: 'Wk 31', critical: 0, major: 1, mitigated: 7 }
]

export default function PredictionsPage() {
  const recommendationEvents = [
    {
      id: 'rec-1',
      title: 'Refactor dependency in AST worker',
      description: 'AI model predicts technical debt reduction of $1,200. Reduces thread lock risk.',
      timestamp: 'Action recommended',
      type: 'info' as const,
      icon: ListTodo,
      tags: ['Refactoring', 'Tech Debt']
    },
    {
      id: 'rec-2',
      title: 'Update Confluence workspace Oauth key',
      description: 'Key expires in 4 days. Manual rotation required.',
      timestamp: 'Action required',
      type: 'warning' as const,
      icon: ShieldAlert,
      tags: ['Security', 'Keys']
    },
    {
      id: 'rec-3',
      title: 'Decouple SQL metrics logging dispatcher',
      description: 'Spike index predicts memory threshold warning at 10k/sec ops rates.',
      timestamp: 'Action recommended',
      type: 'neutral' as const,
      icon: Layers,
      tags: ['Infrastructure', 'Performance']
    }
  ]

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Predictive Analytics & Forecasting"
        description="Forecast technical debt projections, review deployment readiness indexes, and verify automated code vulnerabilities mitigations."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Predictive Analytics' }
        ]}
        status={{ label: 'PREDICTIVE MODELS ACTIVE', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* KPI metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Success Probability"
            value="98.2%"
            subtext="Calculated across active pipelines"
            icon={Zap}
            trend={{ value: '+1.4%', direction: 'up' }}
            accentColor="cyan"
          />
          <MetricCard
            label="Estimated Tech Debt"
            value="$9,400 USD"
            subtext="Refactoring cost forecast"
            icon={Coins}
            trend={{ value: '-$4.8k', direction: 'down', label: 'this month' }}
            accentColor="rose"
          />
          <MetricCard
            label="Deployment Readiness"
            value="96 / 100"
            subtext="Compliance checklist pass"
            icon={Shield}
            trend={{ value: '+2 pts', direction: 'up' }}
            accentColor="emerald"
          />
          <MetricCard
            label="Security Risk Mitigation"
            value="0.02%"
            subtext="Unresolved critical CVE issues"
            icon={ShieldAlert}
            trend={{ value: 'Compliant', direction: 'neutral' }}
            accentColor="violet"
          />
        </div>

        {/* Charts block */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Tech debt curve */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            <ChartCard
              title="Technical Debt ($USD) :: 6-Month Forecast"
              subtitle="Projected tech debt decay comparing baseline velocity versus AI auto-refactoring"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={techDebtData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#ccc' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="current" name="Active Debt" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="projectedNoRefactor" name="Without Refactoring" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="projectedWithAI" name="Projected with AI" stroke="#10b981" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Mitigated vulnerabilities bar chart */}
            <ChartCard
              title="Security Vulnerabilities :: Mitigations Log"
              subtitle="Comparison of captured security vulnerabilities versus AI automated patch completions"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilitiesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#ccc' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="critical" name="Critical Alert" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="major" name="Major Alert" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mitigated" name="AI Mitigated" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>

          {/* Audit lists panel */}
          <div className="flex flex-col border border-white/5 bg-[#0b0c10]/40 backdrop-blur-md p-6 select-none relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Recommended Refactors
                </h4>
                <p className="text-xs text-zinc-500">
                  Codebase patches suggested by predictive models
                </p>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[700px] custom-scrollbar pr-1">
              <ActivityTimeline items={recommendationEvents} />
            </div>
            
            <div className="border-t border-white/5 pt-4 mt-auto">
              <span className="text-[10px] font-mono text-zinc-500 uppercase leading-none block text-center">
                MODELS UPDATED RUNTIME (HOURLY)
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
