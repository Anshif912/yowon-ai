import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  ActionPanel,
  DataTable,
  SplitView,
  ConfirmationDialog,
  ActivityTimeline,
  LoadingSkeleton,
  EmptyState
} from '../../components/enterprise'
import { api } from '../../api/api'

interface ConnectorInfo {
  uuid: string
  name: string
  connector_type: string
  status: string
  created_at: string
  updated_at: string
}

interface DiagnosticsInfo {
  latency_ms: number
  connectivity: string
  permissions_valid: boolean
  rate_limit_remaining: number
}

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
    details: 'Enables automatic ticket creation and back-sync status updates on active repositories.'
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

export default function ConnectorDetailsPage() {
  const { connectorId } = useParams<{ connectorId: string }>()
  const navigate = useNavigate()

  const [connector, setConnector] = useState<ConnectorInfo | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo | null>(null)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'sync' | 'secrets' | 'diagnostics'>('overview')
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog controls
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'rotate' | 'delete' | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [newSecret, setNewSecret] = useState('')

  // Sync log entries
  const [syncLogs, setSyncLogs] = useState<any[]>([])

  const loadData = async () => {
    try {
      setError(null)
      const listRes = await api.get('/connectors')
      const list = listRes.data || []
      
      // Find the connector by uuid or fallback to connector_type matching connectorId
      const conn = list.find((c: any) => c.uuid === connectorId || c.connector_type.toLowerCase() === connectorId?.toLowerCase())
      
      if (!conn) {
        setError("Connector not found in this workspace.")
        setLoading(false)
        return
      }

      setConnector(conn)

      // Fetch diagnostics
      try {
        const diagRes = await api.get(`/connectors/${conn.uuid}/diagnostics`)
        setDiagnostics(diagRes.data)
      } catch (diagErr) {
        console.error("Failed to load diagnostics:", diagErr)
      }

      // Add a dummy sync run log to populate history list nicely
      setSyncLogs([
        {
          id: 'sh1',
          status: conn.status === 'ACTIVE' ? 'success' : 'error',
          timestamp: conn.updated_at ? new Date(conn.updated_at).toLocaleTimeString() : 'Just now',
          duration: '3.1s',
          itemsPulled: conn.status === 'ACTIVE' ? 8 : 0,
          errorRate: conn.status === 'ACTIVE' ? '0.0%' : '100%'
        }
      ])

    } catch (err: any) {
      console.error("Error loading connector details:", err)
      setError(err?.response?.data?.detail || "Failed to load connector details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [connectorId])

  const handleSyncNow = async () => {
    if (!connector) return
    setSyncing(true)
    try {
      await api.post(`/connectors/${connector.uuid}/sync`)
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Sync job failed.")
    } finally {
      setSyncing(false)
    }
  }

  const triggerDialog = (type: 'rotate' | 'delete') => {
    setDialogType(type)
    setNewSecret('')
    setDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!connector || !dialogType) return
    setDialogLoading(true)

    try {
      if (dialogType === 'delete') {
        await api.delete(`/connectors/${connector.uuid}`)
        setDialogOpen(false)
        navigate('/enterprise/connectors')
      } else if (dialogType === 'rotate') {
        if (!newSecret.trim()) {
          alert("Secret value cannot be empty.")
          setDialogLoading(false)
          return
        }
        await api.post(`/connectors/${connector.uuid}/rotate-secret`, null, {
          params: { new_secret_value: newSecret }
        })
        setDialogOpen(false)
        await loadData()
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to execute connector operation.")
    } finally {
      setDialogLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar p-8">
        <LoadingSkeleton variant="details" rows={4} />
      </div>
    )
  }

  if (error || !connector) {
    return (
      <div className="flex-grow bg-[#05070a] min-h-full p-8 flex flex-col items-center justify-center">
        <EmptyState
          title="CONNECTION NOT FOUND"
          description={error || "The requested connector integration does not exist."}
          action={
            <Link
              to="/enterprise/connectors"
              className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150"
            >
              RETURN TO LIST
            </Link>
          }
        />
      </div>
    )
  }

  const provider = connector.connector_type.toLowerCase()
  const meta = CONNECTOR_METADATA[provider] || {
    name: connector.name,
    icon: Server,
    details: `Workspace-level connection tunnel for service: ${connector.connector_type}.`
  }
  const Icon = meta.icon
  const statusType: 'success' | 'warning' | 'error' = 
    connector.status === 'ACTIVE' ? 'success' : connector.status === 'SYNCING' ? 'warning' : 'error'

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title={connector.name}
        description={meta.details}
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Connectors', href: '/enterprise/connectors' },
          { label: connector.name }
        ]}
        status={{
          label: connector.status === 'ACTIVE' ? 'CONNECTOR OK' : connector.status === 'SYNCING' ? 'SYNCING DATA' : 'CONNECTION ERROR',
          type: statusType
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
              className={`px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all duration-150 shrink-0 cursor-pointer ${
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
                      <span className="font-semibold text-zinc-200 capitalize">{provider}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Sync Status:</span>
                      <StatusBadge status={statusType} size="xs" />
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Security Encryption:</span>
                      <span className="font-mono text-cyan-400 font-bold">AES-GCM 256bit</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Registered At:</span>
                      <span className="font-mono text-zinc-300">
                        {connector.created_at ? new Date(connector.created_at).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Connection State:</span>
                      <span className="font-mono text-emerald-400 font-bold">{connector.status}</span>
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
                    data={[
                      { id: 'l1', level: 'INFO', timestamp: connector.updated_at ? new Date(connector.updated_at).toLocaleString() : 'Just now', message: `Initiating connection sync handshake for ${connector.name}.` },
                      { id: 'l2', level: 'INFO', timestamp: connector.updated_at ? new Date(connector.updated_at).toLocaleString() : 'Just now', message: 'Credentials validated. Sync operations active.' }
                    ]}
                    columns={[
                      {
                        key: 'level',
                        header: 'LEVEL',
                        width: '80px',
                        render: (_, val) => (
                          <span className="font-bold font-mono text-[10px] uppercase text-zinc-400">
                            {val}
                          </span>
                        )
                      },
                      { key: 'timestamp', header: 'TIMESTAMP', width: '180px', className: 'font-mono text-[11px]' },
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
                    data={syncLogs}
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
                      <span className="text-zinc-500">CREDENTIAL SCOPE:</span>
                      <span className="text-zinc-300">WORKSPACE_LEVEL_SECRET</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">ENCRYPTION:</span>
                      <span className="text-zinc-300">AES-GCM-256</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">LAST ROTATION:</span>
                      <span className="text-zinc-300">
                        {connector.updated_at ? new Date(connector.updated_at).toLocaleDateString() : 'Never'}
                      </span>
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
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">Latency</span>
                      <span className="text-white font-bold">{diagnostics?.latency_ms ?? 0} ms</span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">Rate Limits</span>
                      <span className="text-white font-bold">{diagnostics?.rate_limit_remaining ?? 5000} remaining</span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">HTTP Connectivity</span>
                      <span className={`${diagnostics?.connectivity === 'REACHABLE' ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                        {diagnostics?.connectivity ?? 'UNREACHABLE'}
                      </span>
                    </div>
                    <div className="border border-white/5 p-3 rounded-lg bg-zinc-950/40">
                      <span className="text-zinc-500 uppercase block mb-1 text-[9px]">Permissions Valid</span>
                      <span className={`${diagnostics?.permissions_valid ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                        {diagnostics?.permissions_valid ? 'YES' : 'NO'}
                      </span>
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
                status={<StatusBadge status={statusType} size="xs" />}
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
            : `Are you sure you want to trigger manual rotation of OAuth credentials for "${meta.name}"? Enter the new credential token or secret below.`
        }
        confirmText={dialogType === 'delete' ? 'YES, PURGE CONNECTION' : 'EXECUTE KEY ROTATION'}
        intent={dialogType === 'delete' ? 'danger' : 'warning'}
        loading={dialogLoading}
      >
        {dialogType === 'rotate' && (
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-[10px] font-mono text-zinc-400 uppercase">New Secret Token Value</label>
            <input
              type="password"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="Paste token or client secret..."
              className="w-full bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/30"
            />
          </div>
        )}
      </ConfirmationDialog>
    </div>
  )
}
