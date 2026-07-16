import React, { useState, useMemo } from 'react'
import {
  Server,
  Activity,
  Layers,
  Database,
  Workflow,
  Cpu,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  Play,
  RotateCw,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Settings,
  Terminal,
  StopCircle
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
  StatusBadge,
  ConfirmationDialog,
  LoadingSkeleton,
  SplitView,
  ActionPanel,
  EmptyState
} from '../../components/enterprise'

interface WorkerProcess {
  id: string
  taskName: string
  memory: string
  threadsCount: number
  uptime: string
  status: 'active' | 'idle' | 'paused' | 'error'
  lastActivity: string
}

const INITIAL_WORKERS: WorkerProcess[] = [
  {
    id: 'worker-node-0x01',
    taskName: 'AST Repositories Scanner',
    memory: '312 MB',
    threadsCount: 4,
    uptime: '14h 22m',
    status: 'active',
    lastActivity: '2s ago'
  },
  {
    id: 'worker-node-0x02',
    taskName: 'Knowledge Graph Compilation',
    memory: '840 MB',
    threadsCount: 8,
    uptime: '3h 10m',
    status: 'active',
    lastActivity: 'Just now'
  },
  {
    id: 'worker-node-0x03',
    taskName: 'SSO Directory Sync Handshake',
    memory: '45 MB',
    threadsCount: 1,
    uptime: '1d 12h',
    status: 'idle',
    lastActivity: '12 mins ago'
  },
  {
    id: 'worker-node-0x04',
    taskName: 'Vulnerability Dispatches Queue',
    memory: '120 MB',
    threadsCount: 2,
    uptime: '4d 6h',
    status: 'active',
    lastActivity: '45s ago'
  },
  {
    id: 'worker-node-0x05',
    taskName: 'Model Fine-tuning Pipeline',
    memory: '2.4 GB',
    threadsCount: 12,
    uptime: '30m',
    status: 'paused',
    lastActivity: '15 mins ago'
  }
]

// Latency telemetry charts data
const queueLatencyData = [
  { time: '10:00', latency: 8, throughput: 120 },
  { time: '10:05', latency: 12, throughput: 110 },
  { time: '10:10', latency: 25, throughput: 95 },
  { time: '10:15', latency: 45, throughput: 80 },
  { time: '10:20', latency: 32, throughput: 130 },
  { time: '10:25', latency: 15, throughput: 140 },
  { time: '10:30', latency: 10, throughput: 145 }
]

export default function OperationsPage() {
  const [workers, setWorkers] = useState<WorkerProcess[]>(INITIAL_WORKERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [poolStatus, setPoolStatus] = useState<'healthy' | 'overloaded' | 'offline'>('healthy')
  
  // Dialog confirmation states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'restart_pool' | 'kill_worker' | null>(null)
  const [targetWorker, setTargetWorker] = useState<WorkerProcess | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  const handleReload = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 800)
  }

  // Filter list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) =>
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.taskName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [workers, searchQuery])

  // Dialog actions trigger
  const triggerPoolAction = (type: 'restart_pool') => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const triggerWorkerAction = (e: React.MouseEvent, worker: WorkerProcess, type: 'kill_worker') => {
    e.stopPropagation()
    setTargetWorker(worker)
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleConfirmAction = () => {
    if (!dialogType) return
    setDialogLoading(true)

    setTimeout(() => {
      if (dialogType === 'restart_pool') {
        setPoolStatus('healthy')
        setWorkers(INITIAL_WORKERS)
      } else if (dialogType === 'kill_worker' && targetWorker) {
        setWorkers(prev => prev.filter(w => w.id !== targetWorker.id))
      }
      setDialogLoading(false)
      setDialogOpen(false)
      setTargetWorker(null)
      setDialogType(null)
    }, 1200)
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title="Infrastructure & Operations"
        description="Monitor CPU cores allocations, examine PostgreSQL sizes, examine threads pools, and terminate orphaned background processes."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Operations' }
        ]}
        status={{ label: 'SYSTEM CORES BALANCED', type: 'success' }}
        actions={
          <button
            onClick={() => triggerPoolAction('restart_pool')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-white border border-white/5 bg-[#0b0c10]/80 rounded-lg hover:border-white/10 transition-all duration-150"
          >
            <RefreshCw size={12} />
            RESTART WORKERS POOL
          </button>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Core telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active CPU Processes"
            value={`${workers.length} Workers`}
            subtext="Queue Status: IDLE"
            icon={Cpu}
            trend={{ value: '4 active', direction: 'up', label: 'threads' }}
            accentColor="cyan"
          />
          <MetricCard
            label="Threads Allocation"
            value="27 / 64 Cores"
            subtext="Max capacity: 64"
            icon={Layers}
            trend={{ value: '42.1%', direction: 'neutral', label: 'load rate' }}
            accentColor="violet"
          />
          <MetricCard
            label="Postgres DB Size"
            value="4.82 GB"
            subtext="Available space: 240 GB"
            icon={Database}
            trend={{ value: '+14MB', direction: 'neutral', label: 'hourly delta' }}
            accentColor="emerald"
          />
          <MetricCard
            label="Queue Tasks Latency"
            value="15ms"
            subtext="Throughput: 145 tps"
            icon={Clock}
            trend={{ value: '-8ms', direction: 'down', label: 'since peak' }}
            accentColor="amber"
          />
        </div>

        {/* Layout divider: Chart (Top/Left) & Processes list (Bottom/Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* List of active worker processes */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            
            <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Worker Processes Pool
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Running daemon containers managing task execution queries
                  </p>
                </div>
                
                <div className="relative w-48 flex items-center group">
                  <Search size={11} className="absolute left-2.5 text-zinc-500 group-focus-within:text-cyan-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter processes..."
                    className="w-full pl-8 pr-3 py-1 text-[11px] font-sans text-white bg-zinc-950/60 border border-white/5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {loading ? (
                <LoadingSkeleton variant="table" rows={4} columns={5} />
              ) : filteredWorkers.length > 0 ? (
                <DataTable
                  rowIdKey="id"
                  data={filteredWorkers}
                  columns={[
                    {
                      key: 'id',
                      header: 'PROCESS ID',
                      width: '180px',
                      render: (_, value) => <span className="font-mono text-zinc-300 font-bold">{value}</span>
                    },
                    { key: 'taskName', header: 'ASSIGNED TASK QUEUE', className: 'text-zinc-400 font-sans font-bold' },
                    { key: 'memory', header: 'MEMORY', width: '100px', className: 'font-mono text-[11px]' },
                    { key: 'threadsCount', header: 'CORES', width: '80px', className: 'font-mono text-[11px] text-center' },
                    {
                      key: 'status',
                      header: 'STATUS',
                      width: '100px',
                      render: (_, value) => (
                        <StatusBadge
                          status={value === 'active' ? 'success' : value === 'idle' ? 'neutral' : value === 'paused' ? 'warning' : 'error'}
                          customLabel={value}
                          size="xs"
                        />
                      )
                    },
                    {
                      key: 'actions',
                      header: 'KILL',
                      width: '80px',
                      className: 'text-right',
                      render: (row) => (
                        <button
                          onClick={(e) => triggerWorkerAction(e, row, 'kill_worker')}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent rounded-lg transition-all duration-150"
                          title="SIGKILL Process"
                        >
                          <StopCircle size={13} />
                        </button>
                      )
                    }
                  ]}
                />
              ) : (
                <EmptyState title="NO PROCESSES FOUND" description="No active processes matched your search queries." variant="simple" />
              )}
            </div>

          </div>

          {/* Right sidebar: Latency chart and controls */}
          <div className="flex flex-col gap-6">
            
            {/* Queue Performance Chart */}
            <ChartCard
              title="Queue Latency History"
              subtitle="Processing latency versus queue throughput trends"
              height={260}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={queueLatencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGlowOps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#05070a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#ccc' }}
                    itemStyle={{ fontSize: '10px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#latencyGlowOps)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Diagnostic Operations Control Panel */}
            <ActionPanel
              title="Global Pool Controls"
              description="Instructs Docker container engines to recycle worker nodes pools."
              status={<span className="text-emerald-400 font-bold font-mono">POOL: COMPLIANT</span>}
              actions={[
                {
                  label: 'SIGTERM REBOOT WORKERS',
                  onClick: () => triggerPoolAction('restart_pool'),
                  icon: RefreshCw,
                  intent: 'secondary'
                }
              ]}
            />

          </div>

        </div>

      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={dialogType === 'restart_pool' ? 'Reboot Daemon Workers Pool?' : 'Send SIGKILL to Daemon Worker?'}
        description={
          dialogType === 'restart_pool'
            ? 'Are you sure you want to trigger a SIGTERM reboot for all workers? Active pipeline scan tasks will be temporarily suspended and queued.'
            : `Are you sure you want to send SIGKILL to process "${targetWorker?.id}"? This kills the task execution thread immediately. Potential partial database transactions might require rollback.`
        }
        confirmText={dialogType === 'restart_pool' ? 'CONFIRM FULL REBOOT' : 'YES, SIGKILL PROCESS'}
        intent="danger"
        loading={dialogLoading}
      />
    </div>
  )
}
