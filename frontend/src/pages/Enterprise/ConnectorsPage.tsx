import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch,
  Slack,
  MessageSquare,
  BookOpen,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Plus,
  Play,
  RotateCw,
  Trash2,
  SlidersHorizontal,
  Search,
  ExternalLink,
  Power,
  ShieldAlert,
  Info,
  Gitlab,
  Bot,
  Sparkles,
  Cpu
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  EmptyState,
  ConfirmationDialog,
  LoadingSkeleton
} from '../../components/enterprise'

interface Connector {
  id: string
  name: string
  provider: string
  icon: any
  status: 'success' | 'warning' | 'error' | 'pending'
  isEnabled: boolean
  lastSync: string
  rateLimit: string
  details: string
}

const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'github',
    name: 'GitHub Enterprise',
    provider: 'github',
    icon: GitBranch,
    status: 'success',
    isEnabled: true,
    lastSync: '5 mins ago',
    rateLimit: '4,850 / 5,000 reqs left',
    details: 'Synchronizes codebase repositories, branches, and security pull request updates.'
  },
  {
    id: 'slack',
    name: 'Slack Workspace',
    provider: 'slack',
    icon: Slack,
    status: 'success',
    isEnabled: true,
    lastSync: '12 mins ago',
    rateLimit: '9,810 / 10,000 reqs left',
    details: 'Dispatches real-time vulnerability scan results and alerts directly into slack channels.'
  },
  {
    id: 'jira',
    name: 'Jira Software',
    provider: 'jira',
    icon: AlertTriangle,
    status: 'error',
    isEnabled: true,
    lastSync: '3 hours ago',
    rateLimit: 'Expired Credentials',
    details: 'Enables automatic ticket creation and back-sync status updates on agent tasks.'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    provider: 'teams',
    icon: MessageSquare,
    status: 'success',
    isEnabled: true,
    lastSync: '1 hour ago',
    rateLimit: 'No Limit',
    details: 'Integrates team messaging webhooks and weekly status briefings distribution.'
  },
  {
    id: 'confluence',
    name: 'Confluence Wiki',
    provider: 'confluence',
    icon: BookOpen,
    status: 'warning',
    isEnabled: false,
    lastSync: 'Never',
    rateLimit: 'None',
    details: 'Pulls documentation context vectors for agent knowledge graph synthesis.'
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    provider: 'gcal',
    icon: Calendar,
    status: 'success',
    isEnabled: true,
    lastSync: '30 mins ago',
    rateLimit: '998 / 1,000 reqs left',
    details: 'Schedules system maintenance periods and agent roadmap evaluations calendar sync.'
  }
]

import { api } from '../../api/api'
import { useWorkspace } from '../../components/auth/WorkspaceContext'

const PROVIDER_ICONS: Record<string, any> = {
  github: GitBranch,
  gitlab: Gitlab,
  bitbucket: GitBranch,
  azure_devops: Cpu,
  slack: Slack,
  jira: AlertTriangle,
  teams: MessageSquare,
  discord: MessageSquare,
  openai: Sparkles,
  gemini: Sparkles,
  ollama: Bot,
  confluence: BookOpen,
  gcal: Calendar
}

export default function ConnectorsPage() {
  const { currentWorkspace } = useWorkspace()
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'enabled' | 'disabled' | 'error'>('all')
  const [loading, setLoading] = useState(false)
  
  // Dialog Actions
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  const [dialogType, setDialogType] = useState<'disconnect' | 'sync' | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Register Connector States
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerType, setRegisterType] = useState('github')
  const [registerSecret, setRegisterSecret] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  // Sync state per connector
  const [syncingStates, setSyncingStates] = useState<Record<string, boolean>>({})

  const fetchConnectors = async () => {
    setLoading(true)
    try {
      const res = await api.get('/connectors')
      const mapped = res.data.map((c: any) => ({
        id: c.uuid,
        name: c.name,
        provider: c.connector_type,
        icon: PROVIDER_ICONS[c.connector_type.toLowerCase()] || GitBranch,
        status: c.status === 'ACTIVE' ? 'success' : (c.status === 'SYNCING' ? 'pending' : 'error'),
        isEnabled: c.status !== 'DISABLED',
        lastSync: c.last_sync ? new Date(c.last_sync).toLocaleTimeString() : 'Never',
        rateLimit: '4,850 / 5,000 reqs left',
        details: `Synchronizes database and service dependencies for provider: ${c.connector_type}.`
      }))
      setConnectors(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnectors()
  }, [currentWorkspace])

  // Filtering logic
  const filteredConnectors = useMemo(() => {
    return connectors.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.details.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (filterType === 'all') return matchesSearch
      if (filterType === 'enabled') return matchesSearch && item.isEnabled
      if (filterType === 'disabled') return matchesSearch && !item.isEnabled
      if (filterType === 'error') return matchesSearch && item.status === 'error'
      return matchesSearch
    })
  }, [connectors, searchQuery, filterType])

  // Trigger individual sync
  const handleTriggerSync = async (e: React.MouseEvent, connector: Connector) => {
    e.preventDefault()
    e.stopPropagation()
    
    setSyncingStates(prev => ({ ...prev, [connector.id]: true }))
    try {
      await api.post(`/connectors/${connector.id}/sync`)
      await fetchConnectors()
    } catch(err) {
      console.error(err)
    } finally {
      setSyncingStates(prev => ({ ...prev, [connector.id]: false }))
    }
  }

  // Toggle connection state
  const handleToggleConnection = (e: React.MouseEvent, connector: Connector) => {
    e.preventDefault()
    e.stopPropagation()
    setConnectors(prev =>
      prev.map(c =>
        c.id === connector.id ? { ...c, isEnabled: !c.isEnabled } : c
      )
    )
  }

  // Reload action
  const handleReload = () => {
    fetchConnectors()
  }

  // Open dialog action
  const triggerActionDialog = (e: React.MouseEvent, connector: Connector, type: 'disconnect' | 'sync') => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedConnector(connector)
    setDialogType(type)
    setDialogOpen(true)
  }

  // Execute dialog confirm
  const handleConfirmDialogAction = async () => {
    if (!selectedConnector || !dialogType) return
    setDialogLoading(true)
    
    try {
      if (dialogType === 'disconnect') {
        await api.delete(`/connectors/${selectedConnector.id}`)
      } else if (dialogType === 'sync') {
        await api.post(`/connectors/${selectedConnector.id}/sync`)
      }
      await fetchConnectors()
    } catch (err) {
      console.error(err)
    } finally {
      setDialogLoading(false)
      setDialogOpen(false)
      setSelectedConnector(null)
      setDialogType(null)
    }
  }

  const handleRegisterConnector = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    try {
      await api.post('/connectors', {
        name: registerName,
        connector_type: registerType,
        secret_value: registerSecret
      })
      setRegisterName('')
      setRegisterSecret('')
      setRegisterOpen(false)
      await fetchConnectors()
    } catch (err) {
      console.error(err)
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title="Database & Service Connectors"
        description="Configure and inspect integration tunnels to external tools, CI/CD pipes, calendar events, and knowledge bases."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Connectors' }
        ]}
        actions={
          <button
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
          >
            <Plus size={13} />
            REGISTER SERVICE CONNECTOR
          </button>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Toolbar section */}
        <div className="flex flex-col gap-4">
          <SearchToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            placeholder="Search active integration tunnels..."
            onReload={handleReload}
            isLoading={loading}
            quickActions={
              <div className="flex items-center gap-1 border border-white/5 bg-zinc-950/60 p-1 rounded-lg">
                {(['all', 'enabled', 'disabled', 'error'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md uppercase transition-colors duration-150 ${
                      filterType === type
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingSkeleton variant="grid" rows={6} columns={3} />
        ) : filteredConnectors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnectors.map((c) => {
              const Icon = c.icon
              const isSyncing = syncingStates[c.id] || false

              return (
                <Link
                  key={c.id}
                  to={`/enterprise/connectors/${c.id}`}
                  className="relative group flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Top neon border glow */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/30 transition-all duration-300" />
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 text-zinc-300 group-hover:text-cyan-400 transition-colors duration-200 shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="flex flex-col text-left">
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {c.name}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                          ID: {c.id}
                        </span>
                      </div>
                    </div>

                    <StatusBadge
                      status={c.isEnabled ? c.status : 'neutral'}
                      customLabel={c.isEnabled ? undefined : 'DISABLED'}
                      size="xs"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col text-left">
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium mb-4 flex-1">
                      {c.details}
                    </p>
                    
                    {/* Telemetry info */}
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">LAST SYNC</span>
                        <span className="font-bold text-zinc-300">{c.lastSync}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">LIMITS</span>
                        <span className="font-bold text-zinc-300 truncate block" title={c.rateLimit}>
                          {c.rateLimit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    className="px-6 py-4 bg-[#05070a] border-t border-white/5 flex items-center justify-between shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleToggleConnection(e, c)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold border rounded-lg transition-all duration-150 ${
                        c.isEnabled
                          ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-white/5'
                          : 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                    >
                      <Power size={11} />
                      <span>{c.isEnabled ? 'DISABLE' : 'ENABLE'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleTriggerSync(e, c)}
                        disabled={!c.isEnabled || isSyncing}
                        className="p-2 text-zinc-400 hover:text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 rounded-lg disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:border-white/5 transition-all duration-150"
                        title="Force Datastream Sync"
                      >
                        <RefreshCw size={11} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
                      </button>
                      
                      <button
                        onClick={(e) => triggerActionDialog(e, c, 'disconnect')}
                        className="p-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent rounded-lg transition-all duration-150"
                        title="Disconnect Integration"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="NO CONNECTORS MATCHED"
            description="Adjust your search syntax or change status filters to find your integrations."
            action={
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150"
              >
                RESET FILTERS
              </button>
            }
          />
        )}
      </div>

      {/* Confirmation modal */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmDialogAction}
        title={dialogType === 'disconnect' ? 'Revoke Connection Tunnel?' : 'Force Datastream Sync?'}
        description={
          dialogType === 'disconnect'
            ? `Are you sure you want to permanently disable and delete the connection details for "${selectedConnector?.name}"? All sync states and integration configurations will be purged.`
            : `Are you sure you want to force an immediate background database sync for "${selectedConnector?.name}"? This consumes from your service provider hourly rates limits.`
        }
        confirmText={dialogType === 'disconnect' ? 'REVOKE DISCONNECT' : 'FORCE RUN SYNC'}
        intent={dialogType === 'disconnect' ? 'danger' : 'info'}
        loading={dialogLoading}
      />

      {/* Register Connector Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/10 bg-[#0b0c10] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider text-left">
                Register Service Connector
              </h3>
              <button 
                onClick={() => setRegisterOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRegisterConnector} className="p-6 flex flex-col gap-4 text-left">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="e.g. GitHub Token"
                  className="w-full px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Provider Type</label>
                <select
                  value={registerType}
                  onChange={(e) => setRegisterType(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none"
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="bitbucket">Bitbucket</option>
                  <option value="azure_devops">Azure DevOps</option>
                  <option value="slack">Slack</option>
                  <option value="jira">Jira</option>
                  <option value="discord">Discord</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Access Token / Secret</label>
                <input
                  type="password"
                  required
                  value={registerSecret}
                  onChange={(e) => setRegisterSecret(e.target.value)}
                  placeholder="e.g. ghp_..."
                  className="w-full px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-4 py-2 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg disabled:opacity-50 transition-all"
                >
                  {registerLoading ? 'REGISTERING...' : 'CONFIRM REGISTER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
