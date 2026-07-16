import React from 'react'
import {
  Layers,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  Workflow,
  Sparkles,
  ArrowRight,
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
import {
  PageHeader,
  MetricCard,
  ChartCard,
  DataTable,
  StatusBadge
} from '../../components/enterprise'

// DNA Evolution line chart data
const dnaEvolutionData = [
  { month: 'Jan', engineering: 75, security: 82, architecture: 70 },
  { month: 'Feb', engineering: 78, security: 85, architecture: 74 },
  { month: 'Mar', engineering: 82, security: 88, architecture: 78 },
  { month: 'Apr', engineering: 88, security: 92, architecture: 82 },
  { month: 'May', engineering: 91, security: 95, architecture: 85 },
  { month: 'Jun', engineering: 92, security: 98, architecture: 88 }
]

// Risk distribution charts data
const riskDistributionData = [
  { project: 'yowon-ui', critical: 0, high: 2, medium: 5 },
  { project: 'yowon-engine', critical: 1, high: 4, medium: 8 },
  { project: 'yowon-auth', critical: 0, high: 1, medium: 2 }
]

// Executive decisions recommendations data
const MOCK_DECISIONS = [
  { id: 'dec-1', action: 'Rotate AWS IAM Access Key', project: 'Global Infrastructure', priority: 'critical', impact: 'Prevents credentials leakage threats' },
  { id: 'dec-2', action: 'Refactor async task worker routines', project: 'yowon-ai-engine', priority: 'high', impact: 'Decreases background workers latency (~10ms)' },
  { id: 'dec-3', action: 'Upgrade SonarQube Connector to v1.2', project: 'Scanners Integrations', priority: 'medium', impact: 'Resolves API rate limit warning alerts' }
]

export default function ExecutiveDashboardPage() {
  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Executive Portfolio Dashboard"
        description="High-level corporate workspace index compiling code quality, security rules compliance, innovation rates, and systems architectural drifts."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Executive Portfolio' }
        ]}
        status={{ label: 'WORKSPACE COMPLIANT', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Aggregate indices cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Engineering Index"
            value="92 / 100"
            subtext="Calculated from codebase velocity"
            icon={Zap}
            trend={{ value: 'Excellent', direction: 'up' }}
            accentColor="cyan"
          />
          <MetricCard
            label="Security Compliance"
            value="98 / 100"
            subtext="No active critical vulnerabilities"
            icon={Shield}
            trend={{ value: 'Compliant', direction: 'up' }}
            accentColor="emerald"
          />
          <MetricCard
            label="Innovation Velocity"
            value="85 / 100"
            subtext="Based on features release counts"
            icon={Sparkles}
            trend={{ value: '+5.2%', direction: 'up' }}
            accentColor="amber"
          />
          <MetricCard
            label="Architecture Stability"
            value="88 / 100"
            subtext="Calculated drift metrics"
            icon={Layers}
            trend={{ value: 'Stable', direction: 'neutral' }}
            accentColor="violet"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* DNA Evolution Line Chart */}
          <ChartCard
            title="DNA Evolution Trends"
            subtitle="Engineering quality, security adherence, and architectural alignment monthly history"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dnaEvolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#ccc' }}
                  itemStyle={{ fontSize: '11px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="engineering" name="Engineering Index" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="security" name="Security Compliance" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="architecture" name="Architecture Stability" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Risk distribution bar chart */}
          <ChartCard
            title="System Risk Distribution"
            subtitle="Breakdown of static analysis vulnerability scopes across primary repositories"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="project" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#ccc' }}
                  itemStyle={{ fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="critical" name="Critical Risk" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" name="High Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" name="Medium Risk" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* Recommended decisions table */}
        <div className="flex flex-col border border-white/5 bg-[#0b0c10]/40 backdrop-blur-md rounded-xl p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
          
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Recommended Actions
              </h4>
              <p className="text-xs text-zinc-500">
                Strategic mitigation decisions compiled by YOWON cognitive engines
              </p>
            </div>
            <StatusBadge status="info" size="xs" customLabel="cognitive actions queue" />
          </div>

          <DataTable
            rowIdKey="id"
            data={MOCK_DECISIONS}
            columns={[
              {
                key: 'action',
                header: 'RECOMMENDED DECISION ACTION',
                render: (_, val) => <span className="font-sans font-bold text-zinc-200">{val}</span>
              },
              { key: 'project', header: 'SCOPE / WORKSPACE', width: '220px', className: 'font-mono text-zinc-400 text-[11px]' },
              {
                key: 'priority',
                header: 'PRIORITY',
                width: '120px',
                render: (_, val) => (
                  <StatusBadge
                    status={val === 'critical' ? 'error' : val === 'high' ? 'warning' : 'info'}
                    customLabel={val}
                    size="xs"
                  />
                )
              },
              { key: 'impact', header: 'PROJECTED OUTCOME IMPACT', className: 'font-sans text-zinc-400 text-xs' }
            ]}
          />

        </div>

      </div>
    </div>
  )
}
