import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  Cpu,
  Shield,
  Layers,
  Activity,
  Workflow,
  Globe,
  Plus,
  ArrowRight,
  RefreshCw,
  GitBranch,
  Key,
  ShieldCheck,
  AlertTriangle,
  Play
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
import { PageHeader, MetricCard, ChartCard, ActivityTimeline } from '../../components/enterprise'

// Demo data for charts
const systemMetricsData = [
  { time: '09:00', cpu: 22, memory: 45, latency: 12, queryRate: 450 },
  { time: '09:10', cpu: 28, memory: 46, latency: 15, queryRate: 520 },
  { time: '09:20', cpu: 35, memory: 48, latency: 22, queryRate: 640 },
  { time: '09:30', cpu: 45, memory: 52, latency: 45, queryRate: 850 },
  { time: '09:40', cpu: 42, memory: 50, latency: 35, queryRate: 810 },
  { time: '09:50', cpu: 30, memory: 49, latency: 18, queryRate: 700 },
  { time: '10:00', cpu: 26, memory: 49, latency: 14, queryRate: 580 },
]

export default function EnterpriseOverviewPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState('10 mins ago')

  const handleSyncAll = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setLastSyncTime('Just now')
    }, 1500)
  }

  const auditEvents = [
    {
      id: 1,
      title: 'GitHub Connector Synced Successfully',
      description: 'Synchronized repository status and pulled 14 active pull requests.',
      timestamp: '5 mins ago',
      type: 'success' as const,
      icon: GitBranch,
      tags: ['Connectors', 'GitHub'],
      action: <Link to="/enterprise/connectors/github" className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold">VIEW</Link>
    },
    {
      id: 2,
      title: 'Secret Key Rotated: OpenAI API Key',
      description: 'Automated secret rotation policy executed successfully. Old token revoked.',
      timestamp: '1 hour ago',
      type: 'info' as const,
      icon: Key,
      tags: ['Security', 'Vault', 'OpenAI'],
      action: <Link to="/enterprise/secrets" className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold">VAULT</Link>
    },
    {
      id: 3,
      title: 'Database Query Spike Detected',
      description: 'Active database queries spiked to 1,200 ops/sec. Load balancer optimized query routing.',
      timestamp: '2 hours ago',
      type: 'warning' as const,
      icon: Database,
      tags: ['Infrastructure', 'PostgreSQL'],
    },
    {
      id: 4,
      title: 'Jira Integration Health Check Failed',
      description: 'OAuth token handshake failed. Connection temporarily suspended.',
      timestamp: '3 hours ago',
      type: 'error' as const,
      icon: AlertTriangle,
      tags: ['Connectors', 'Jira'],
      action: <Link to="/enterprise/connectors/jira" className="text-[10px] font-mono text-red-400 hover:text-red-300 font-bold font-mono">FIX</Link>
    }
  ]

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      {/* Page Header */}
      <PageHeader
        title="Enterprise Hub"
        description="Unified management panel for database connectors, secrets vaults, extensions marketplace, and system telemetry."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Overview' }
        ]}
        status={{ label: 'SYSTEM STATE: ONLINE', type: 'success' }}
        actions={
          <>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-white border border-white/5 bg-[#0b0c10]/80 rounded-lg hover:border-white/10 transition-all duration-150"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin text-cyan-400' : ''} />
              FORCE SYNC ALL
            </button>
            <Link
              to="/enterprise/connectors"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-150"
            >
              <Plus size={12} />
              NEW CONNECTOR
            </Link>
          </>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Integrations Health"
            value="8 / 9"
            subtext={`Last global refresh: ${lastSyncTime}`}
            icon={Layers}
            trend={{ value: '88.9%', direction: 'up', label: 'live rate' }}
            accentColor="cyan"
          />
          <MetricCard
            label="Credential Vault"
            value="14 Secrets"
            subtext="Vault status: ENCRYPTED"
            icon={Shield}
            trend={{ value: '100%', direction: 'neutral', label: 'compliance' }}
            accentColor="violet"
          />
          <MetricCard
            label="Webhook Streams"
            value="99.98%"
            subtext="Deliveries (24h): 4,810"
            icon={Globe}
            trend={{ value: '0.02% DLQ', direction: 'neutral', label: 'retry rate' }}
            accentColor="emerald"
          />
          <MetricCard
            label="Background Workers"
            value="6 Active"
            subtext="Jobs pending: 0"
            icon={Workflow}
            trend={{ value: '12ms', direction: 'up', label: 'latency' }}
            accentColor="amber"
          />
        </div>

        {/* Layout split: Charts (Left) & Audit Logs (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Charts panel - takes 2 cols on wide screens */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* System Latency & Query Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <ChartCard
                title="Telemetry :: Latency Profile"
                subtitle="Background worker tasks processing latency queue (ms)"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={systemMetricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#8b5cf6', fontSize: '10px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#latencyGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Database :: Ops Rate"
                subtitle="Active read/write operations per second (ops/sec)"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={systemMetricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="queryGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#06b6d4', fontSize: '10px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="queryRate" name="Queries" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#queryGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

            </div>

            {/* Hardware Utilization Card */}
            <ChartCard
              title="Infrastructure :: Hardware Load"
              subtitle="Comparison of CPU load and Memory workspace footprints"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemMetricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="memoryGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#ccc' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU Utilization (%)" stroke="#22d3ee" strokeWidth={1.5} fillOpacity={1} fill="url(#cpuGlow)" />
                  <Area type="monotone" dataKey="memory" name="Memory Usage (%)" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#memoryGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>

          {/* Audit Logs panel - takes 1 col */}
          <div className="flex flex-col border border-white/5 rounded-xl bg-[#0b0c10]/40 backdrop-blur-md p-6 select-none relative overflow-hidden">
            
            {/* Top Border Deco */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-bold tracking-wider text-zinc-300 font-mono uppercase">
                  SYSTEM AUDIT events
                </h3>
                <p className="text-xs text-zinc-500">
                  Global telemetry transaction timeline
                </p>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[700px] custom-scrollbar pr-1">
              <ActivityTimeline items={auditEvents} />
            </div>

            <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-end">
              <Link
                to="/enterprise/operations"
                className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors duration-150"
              >
                SYSTEM WORKERS DIAGNOSTICS
                <ArrowRight size={12} />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
