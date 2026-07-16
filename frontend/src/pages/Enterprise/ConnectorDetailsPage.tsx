import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  GitBranch,
  Slack,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Calendar,
  Activity,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Key,
  ShieldAlert,
  Server,
  Lock,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  ActionPanel,
  DataTable,
  SplitView,
  ConfirmationDialog,
  ActivityTimeline
} from '../../components/enterprise'

const CONNECTOR_METADATA: Record<string, { name: string; icon: any; details: string }> = {
  github: {
    name: 'GitHub Enterprise',
    icon: GitBranch,
    details: 'Synchronizes codebase repositories, branches, and security pull request updates.'
  },
  slack: {
    name: 'Slack Workspace',
    icon: Slack,
    details: 'Dispatches real-time vulnerability scan results and alerts directly into slack channels.'
  },
  jira: {
    name: 'Jira Software',
    icon: AlertTriangle,
    details: 'Enables automatic ticket creation and back-sync status updates on agent tasks.'
  },
  teams: {
    name: 'Microsoft Teams',
    icon: MessageSquare,
    details: 'Integrates team messaging webhooks and weekly status briefings distribution.'
  },
  confluence: {
    name: 'Confluence Wiki',
    icon: BookOpen,
    details: 'Pulls documentation context vectors for agent knowledge graph synthesis.'
  },
  gcal: {
    name: 'Google Calendar',
    icon: Calendar,
    details: 'Schedules system maintenance periods and agent roadmap evaluations calendar sync.'
  }
}

// Mock logs data
const MOCK_LOGS = [
  { id: 'l1', level: 'INFO', timestamp: '2026-07-16 09:30:12', message: 'Initiating repository sync handshake.' },
  { id: 'l2', level: 'INFO', timestamp: '2026-07-16 09:30:14', message: 'OAuth credentials verified. Handshake success.' },
  { id: 'l3', level: 'DEBUG', timestamp: '2026-07-16 09:30:15', message: 'Pulling refs/heads/main branches.' },
  { id: 'l4', level: 'WARN', timestamp: '2026-07-16 09:31:02', message: 'Rate limit warning: 90% threshold exceeded.' },
  { id: 'l5', level: 'INFO', timestamp: '2026-07-16 09:31:10', message: 'Sync complete. 12 repositories, 4 pull requests updated.' }
]

// Mock sync history data
const MOCK_SYNC_HISTORY = [
  { id: 'sh1', status: 'success', timestamp: '10 mins ago', duration: '5.2s', itemsPulled: 12, errorRate: '0.0%' },
  { id: 'sh2', status: 'success', timestamp: '1 hour ago', duration: '4.8s', itemsPulled: 8, errorRate: '0.0%' },
  { id: 'sh3', status: 'error', timestamp: '3 hours ago', duration: '12.4s', itemsPulled: 0, errorRate: '100%' },
  { id: 'sh4', status: 'success', timestamp: '12 hours ago', duration: '5.1s', itemsPulled: 14, errorRate: '0.0%' }
]

export default function ConnectorDetailsPage() {
  const { connectorId = 'github' } = useParams<{ connectorId: string }>()
  const meta = CONNECTOR_METADATA[connectorId] || {
    name: 'Unknown Connector',
    icon: Server,
    details: 'No detailed profile exists for this custom integration.'
  }
  const Icon = meta.icon

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'sync' | 'secrets' | 'diagnostics'>('overview')
  const [syncing, setSyncing] = useState(false)
  const [rotating, setRotating] = useState(false)
  
  // Dialog controls
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'rotate' | 'delete' | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Status mapping
  const [status, setStatus] = useState<'success' | 'warning' | 'error'>(
    connectorId === 'jira' ? 'error' : connectorId === 'confluence' ? 'warning' : 'success'
  )

  const handleSyncNow = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setStatus('success')
    }, 1500)
  }

  const triggerDialog = (type: 'rotate' | 'delete') => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleConfirmAction = () => {
    if (!dialogType) return
    setDialogLoading(true)
    setTimeout(() => {
      setDialogLoading(false)
      setDialogOpen(false)
      if (dialogType === 'rotate') {
        // rotation complete logic
      }
    }, 1200)
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title={meta.name}
        description={meta.details}
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Connectors', href: '/enterprise/connectors' },
          { label: meta.name }
        ]}
        status={{
          label: status === 'success' ? 'CONNECTOR OK' : status === 'error' ? 'CONNECTION FAILING' : 'ATTENTION REQUIRED',
          type: status
        }}
        actions={
          <Link
            to="/enterprise/connectors"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-white border border-white/5 bg-[#0b0c10]/80 rounded-lg hover:border-white/10 transition-all duration-150"
          >
            <ArrowLeft size={12} />
            BACK TO LIST
          </Link>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs bar */}
        <div className="flex items-center gap-1 border-b border-white/5 pb-px w-full overflow-x-auto shrink-0">
          {(['overview', 'logs', 'sync', 'secrets', 'diagnostics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all duration-150 shrink-0 ${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'sync' ? 'sync history' : tab}
            </button>
          ))}
        </div>

        {/* Split View Content Layout */}
        <SplitView
          leftPanel={
            <div className="flex flex-col gap-6">
              
              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4">
                    Connection Info
                  </h4>
                  <div className="flex flex-col gap-3.5 text-xs font-sans">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Service Provider:</span>
                      <span className="font-semibold text-zinc-200 capitalize">{connectorId}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Sync Status:</span>
                      <StatusBadge status={status} size="xs" />
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Security Encryption:</span>
                      <span className="font-mono text-cyan-400 font-bold">AES-GCM 256bit</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Last Successful Sync:</span>
                      <span className="font-mono text-zinc-300">5 mins ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Webhook Registered:</span>
                      <span className="font-mono text-zinc-300">ACTIVE</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Logs Tab Content */}
              {activeTab === 'logs' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono mb-1">
                    <Terminal size={14} className="text-cyan-400" />
                    <span>RECENT EXECUTION TELEMETRY LOGS</span>
                  </div>
                  <DataTable
                    rowIdKey="id"
                    data={MOCK_LOGS}
                    columns={[
                      {
                        key: 'level',
                        header: 'LEVEL',
                        width: '80px',
                        render: (_, val) => (
                          <span
                            className={`font-bold font-mono text-[10px] uppercase ${
                              val === 'WARN' ? 'text-amber-400' : val === 'ERROR' ? 'text-red-400' : 'text-zinc-400'
                            }`}
                          >
                            {val}
                          </span>
                        )
                      },
                      { key: 'timestamp', header: 'TIMESTAMP', width: '150px', className: 'font-mono text-[11px]' },
                      { key: 'message', header: 'MESSAGE', className: 'font-mono text-[11px] text-zinc-400' }
                    ]}
                  />
                </div>
              )}

              {/* Sync History Tab Content */}
              {activeTab === 'sync' && (
                <div className="flex flex-col gap-4">
                  <DataTable
                    rowIdKey="id"
                    data={MOCK_SYNC_HISTORY}
                    columns={[
                      {
                        key: 'status',
                        header: 'STATUS',
                        width: '100px',
                        render: (_, val) => <StatusBadge status={val} size="xs" />
                      },
                      { key: 'timestamp', header: 'RUN TIMESTAMP', width: '150px', className: 'font-mono' },
                      { key: 'duration', header: 'DURATION', className: 'font-mono' },
                      { key: 'itemsPulled', header: 'PULLED ITEMS', className: 'font-mono text-zinc-300' },
                      { key: 'errorRate', header: 'ERROR RATE', className: 'font-mono text-zinc-400' }
                    ]}
                  />
                </div>
              )}

              {/* Secrets Tab Content */}
              {activeTab === 'secrets' && (
                <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={15} className="text-cyan-400" />
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      API Credentials Vault
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-5">
                    Credentials for external API handshakes are encrypted at rest using AES-GCM-256 and rotated on scheduled intervals. Access credentials details or trigger rotations below.
                  </p>
                  <div className="flex flex-col gap-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">CREDENTIAL ID:</span>
                      <span className="text-zinc-300">SEC-TUNNEL-GTHB-0x2A1F</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">EXPIRES AT:</span>
                      <span className="text-amber-400">July 31, 2026</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">LAST ROTATION:</span>
                      <span className="text-zinc-300">14 days ago</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostics Tab Content */}
              {activeTab === 'diagnostics' && (
                <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left gap-4">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Infrastructure Diagnostics
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">Active Threads</span>
                      <span className="text-white font-bold">4 / 16 (Dynamic)</span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">Rate Limits</span>
                      <span className="text-white font-bold">4.8k remaining</span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">HTTP Status</span>
                      <span className="text-emerald-400 font-bold">200 OK (KeepAlive)</span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">SSL Expiration</span>
                      <span className="text-white font-bold">142 Days</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          }
          rightPanel={
            <div className="flex flex-col gap-6">
              
              {/* Connector Actions Control Card */}
              <ActionPanel
                title="Tunnel Operations"
                description="Manage data connection, pull cycles, database updates, and credentials rotation."
                status={<StatusBadge status={status} size="xs" />}
                actions={[
                  {
                    label: syncing ? 'SYNCING TUNNEL...' : 'FORCE LIVE SYNC',
                    onClick: handleSyncNow,
                    icon: RefreshCw,
                    intent: 'primary',
                    disabled: syncing
                  },
                  {
                    label: 'ROTATE API SECRETS',
                    onClick: () => triggerDialog('rotate'),
                    icon: Key,
                    intent: 'secondary'
                  }
                ]}
              />

              {/* Danger Zone Controls Card */}
              <ActionPanel
                title="Danger Zone Operations"
                description="Removing or disconnecting integration tunnels will purge all synced states and credentials."
                isDangerous={true}
                actions={[
                  {
                    label: 'DISCONNECT INTEGRATION',
                    onClick: () => triggerDialog('delete'),
                    icon: Trash2,
                    intent: 'danger'
                  }
                ]}
              />

            </div>
          }
          leftWidth="w-full xl:w-2/3"
          rightWidth="w-full xl:w-1/3"
        />

      </div>

      {/* Confirmation Modals */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={dialogType === 'delete' ? 'Disconnect and Purge Integration?' : 'Rotate Integration API Secrets?'}
        description={
          dialogType === 'delete'
            ? `Are you sure you want to permanently disable and delete the connection tunnel for "${meta.name}"? This action cannot be undone.`
            : `Are you sure you want to trigger manual rotation of OAuth credentials for "${meta.name}"? Active background workers might temporarily reject calls during the keys transition.`
        }
        confirmText={dialogType === 'delete' ? 'YES, PURGE CONNECTION' : 'EXECUTE KEY ROTATION'}
        intent={dialogType === 'delete' ? 'danger' : 'warning'}
        loading={dialogLoading}
      />
    </div>
  )
}
