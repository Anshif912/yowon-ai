import React, { useState, useMemo, useEffect } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Info,
  UserCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  DataTable,
  InspectorPanel,
  ConfirmationDialog,
  LoadingSkeleton,
  EmptyState
} from '../../components/enterprise'

interface APIKeySecret {
  id: string
  name: string
  service: string
  value: string
  status: 'active' | 'warning' | 'expired'
  created: string
  expires: string
  scope: string
  lastRotated: string
  accessedBy: string
}

const INITIAL_SECRETS: APIKeySecret[] = [
  {
    id: 'sec-1',
    name: 'OpenAI GPT-4 Token',
    service: 'OpenAI API',
    value: 'sk-proj-4a2B...8f7A',
    status: 'active',
    created: '2026-06-01',
    expires: '2027-06-01',
    scope: 'chat.completions, fine-tuning',
    lastRotated: '45 days ago',
    accessedBy: 'LLM Agent Pipeline (Worker-2)'
  },
  {
    id: 'sec-2',
    name: 'GitHub OAuth Client Secret',
    service: 'GitHub Enterprise',
    value: 'ghs_89aJ...f92D',
    status: 'active',
    created: '2026-05-15',
    expires: '2026-11-15',
    scope: 'repo, read:org, workflow',
    lastRotated: '61 days ago',
    accessedBy: 'GitSync Dispatcher'
  },
  {
    id: 'sec-3',
    name: 'Azure Active Directory Client Secret',
    service: 'Azure AD Connect',
    value: 'azs_73lK...d29X',
    status: 'warning',
    created: '2025-07-20',
    expires: '2026-07-20',
    scope: 'user.read, directory.read.all',
    lastRotated: '360 days ago',
    accessedBy: 'Auth Service / SSO Handshake'
  },
  {
    id: 'sec-4',
    name: 'Confluence Wiki Integration Key',
    service: 'Atlassian Cloud',
    value: 'at-token-93fK...c29P',
    status: 'expired',
    created: '2025-01-10',
    expires: '2026-01-10',
    scope: 'read:confluence-space, read:confluence-content',
    lastRotated: 'Never',
    accessedBy: 'Knowledge MindMap Indexer'
  }
]

import { api } from '../../api/api'
import { useWorkspace } from '../../components/auth/WorkspaceContext'

export default function SecretsVaultPage() {
  const { currentWorkspace } = useWorkspace()
  const [secrets, setSecrets] = useState<APIKeySecret[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Secret reveal states mapping
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({})
  
  // Selected secret for inspector
  const [selectedSecret, setSelectedSecret] = useState<APIKeySecret | null>(null)
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  
  // Modal dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'rotate' | 'revoke' | null>(null)
  const [dialogSecret, setDialogSecret] = useState<APIKeySecret | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Register Secret States
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerSecret, setRegisterSecret] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  const fetchSecrets = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vault/secrets')
      const mapped = res.data.map((s: any) => ({
        id: s.uuid,
        name: s.secret_key_name,
        service: s.connector_id ? `Connector (ID: ${s.connector_id.slice(0,8)})` : 'Manual Secret',
        value: '••••••••••••••••',
        status: s.current_version > 1 ? 'active' : 'active',
        created: new Date(s.created_at).toISOString().split('T')[0],
        expires: 'Never',
        scope: 'read, write',
        lastRotated: s.current_version > 1 ? `Version ${s.current_version}` : 'Never',
        accessedBy: 'LLM Pipeline'
      }))
      setSecrets(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessLogs = async (secretId: string) => {
    try {
      const res = await api.get(`/vault/secrets/${secretId}/logs`)
      setAccessLogs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSecrets()
  }, [currentWorkspace])

  useEffect(() => {
    if (selectedSecret) {
      fetchAccessLogs(selectedSecret.id)
    } else {
      setAccessLogs([])
    }
  }, [selectedSecret])

  const handleToggleReveal = async (id: string) => {
    if (revealedIds[id]) {
      setRevealedIds(prev => ({ ...prev, [id]: false }))
    } else {
      try {
        const res = await api.get(`/vault/secrets/${id}`)
        setDecryptedValues(prev => ({ ...prev, [id]: res.data.value }))
        setRevealedIds(prev => ({ ...prev, [id]: true }))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleReload = () => {
    fetchSecrets()
  }

  // Filter secrets
  const filteredSecrets = useMemo(() => {
    return secrets.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.service.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [secrets, searchQuery])

  // Open rotation confirmation
  const triggerAction = (e: React.MouseEvent, secret: APIKeySecret, type: 'rotate' | 'revoke') => {
    e.stopPropagation()
    setDialogSecret(secret)
    setDialogType(type)
    setDialogOpen(true)
  }

  // Handle rotate / revoke execution
  const handleConfirmAction = async () => {
    if (!dialogSecret || !dialogType) return
    setDialogLoading(true)
    
    try {
      if (dialogType === 'rotate') {
        const newSecretVal = prompt("Enter new credentials value for rotation:")
        if (newSecretVal) {
          await api.post(`/vault/secrets/${dialogSecret.id}/rotate`, {
            new_value: newSecretVal
          })
        }
      } else if (dialogType === 'revoke') {
        await api.delete(`/vault/secrets/${dialogSecret.id}`)
      }
      await fetchSecrets()
      setSelectedSecret(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDialogLoading(false)
      setDialogOpen(false)
      setDialogSecret(null)
      setDialogType(null)
    }
  }

  const handleRegisterSecret = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    try {
      await api.post('/vault/secrets', {
        name: registerName,
        secret_value: registerSecret
      })
      setRegisterName('')
      setRegisterSecret('')
      setRegisterOpen(false)
      await fetchSecrets()
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
        title="Secure Key Manager Vault"
        description="Encrypted credentials repository mapping external REST tokens, client credentials, and integrations API keys."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Secrets Vault' }
        ]}
        status={{ label: 'VAULT ENCRYPTED (AES-GCM)', type: 'success' }}
        actions={
          <button 
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
          >
            <Plus size={13} />
            REGISTER SECURE API KEY
          </button>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Search Toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          placeholder="Filter secure API keys by provider or service name..."
          onReload={handleReload}
          isLoading={loading}
        />

        {/* Content Table */}
        {loading ? (
          <LoadingSkeleton variant="table" rows={5} columns={6} />
        ) : filteredSecrets.length > 0 ? (
          <DataTable
            rowIdKey="id"
            data={filteredSecrets}
            onRowClick={(row) => setSelectedSecret(row)}
            columns={[
              {
                key: 'name',
                header: 'CREDENTIAL NAME',
                width: '240px',
                render: (_, value) => (
                  <div className="flex items-center gap-2">
                    <Lock size={12} className="text-zinc-500 shrink-0" />
                    <span className="font-bold text-white hover:text-cyan-400 transition-colors duration-150">
                      {value}
                    </span>
                  </div>
                )
              },
              { key: 'service', header: 'SERVICE / SCOPE', className: 'text-zinc-400 font-mono text-[11px]' },
              {
                key: 'value',
                header: 'API TOKEN VALUE',
                width: '200px',
                render: (row, value) => {
                  const isRevealed = revealedIds[row.id] || false
                  return (
                    <div className="flex items-center gap-2 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                      <span className="text-zinc-300">
                        {isRevealed ? (decryptedValues[row.id] || value) : '••••••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => handleToggleReveal(row.id)}
                        className="text-zinc-500 hover:text-white transition-colors duration-150"
                        title={isRevealed ? 'Mask Token' : 'Reveal Token'}
                      >
                        {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  )
                }
              },
              {
                key: 'status',
                header: 'STATUS',
                width: '100px',
                render: (_, value) => (
                  <StatusBadge
                    status={value === 'active' ? 'success' : value === 'warning' ? 'warning' : 'error'}
                    customLabel={value}
                    size="xs"
                  />
                )
              },
              { key: 'expires', header: 'EXPIRATION DATE', className: 'font-mono text-zinc-400 text-[11px]' },
              {
                key: 'actions',
                header: 'OPERATIONS',
                width: '100px',
                className: 'text-right',
                render: (row) => (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => triggerAction(e, row, 'rotate')}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 rounded-lg transition-all duration-150"
                      title="Force Secret Rotation"
                    >
                      <RefreshCw size={11} />
                    </button>
                    <button
                      onClick={(e) => triggerAction(e, row, 'revoke')}
                      className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent rounded-lg transition-all duration-150"
                      title="Revoke and Purge Secret"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              }
            ]}
          />
        ) : (
          <EmptyState
            title="VAULT EMPTY"
            description="No encrypted secrets matched your search syntax. Register an API key to begin integration secure connections."
            action={
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150"
              >
                CLEAR FILTER
              </button>
            }
          />
        )}

      </div>

      {/* Secret Detail Inspector Slideout */}
      <InspectorPanel
        isOpen={!!selectedSecret}
        onClose={() => setSelectedSecret(null)}
        title={selectedSecret?.name || ''}
        subtitle="Credentials Metadata & Audit Trail"
        actions={
          selectedSecret ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => triggerAction(e, selectedSecret, 'rotate')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold border border-white/10 text-zinc-300 hover:text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all duration-150"
              >
                <RefreshCw size={11} />
                ROTATE KEY
              </button>
              
              <button
                onClick={(e) => triggerAction(e, selectedSecret, 'revoke')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-150"
              >
                <Trash2 size={11} />
                REVOKE KEY
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedSecret && (
          <div className="flex flex-col gap-6 text-left">
            {/* General Status Card */}
            <div className="flex flex-col border border-white/5 bg-zinc-950/40 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">VAULT IDENTIFIER</span>
                <span className="font-mono text-xs text-zinc-400">{selectedSecret.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">SECRET LEVEL</span>
                <StatusBadge status={selectedSecret.status === 'active' ? 'success' : selectedSecret.status === 'warning' ? 'warning' : 'error'} customLabel={selectedSecret.status} size="xs" />
              </div>
            </div>

            {/* Scope / Operations info */}
            <div className="flex flex-col gap-3 font-mono text-xs border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <Info size={12} className="text-cyan-400" />
                <span>Scope Configuration</span>
              </div>
              <div className="bg-[#05070a] border border-white/5 p-3 rounded-lg text-zinc-400 font-mono text-[11px] leading-relaxed break-all">
                {selectedSecret.scope}
              </div>
            </div>

            {/* Access Audit */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-zinc-400 font-bold font-mono uppercase tracking-wider text-[10px]">
                <UserCheck size={12} className="text-cyan-400" />
                <span>Recent Access History</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {accessLogs.length > 0 ? (
                  accessLogs.map((log: any) => (
                    <div key={log.uuid} className="flex flex-col text-left text-xs border-b border-white/5 pb-2">
                      <span className="text-zinc-200 font-medium font-mono text-[9px] break-all">Actor: {log.actor_id}</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                        {new Date(log.accessed_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500 font-mono text-[10px]">No access records recorded yet.</span>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <Calendar size={12} className="text-cyan-400" />
                <span>Vault Lifecycle</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-white/5 p-3 rounded-lg">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">CREATED</span>
                  <span className="text-zinc-300 font-semibold">{selectedSecret.created}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">EXPIRES</span>
                  <span className="text-zinc-300 font-semibold">{selectedSecret.expires}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 uppercase text-[10px]">LAST AUTO ROTATION</span>
                <span className="text-zinc-300 font-semibold">{selectedSecret.lastRotated}</span>
              </div>
            </div>
          </div>
        )}
      </InspectorPanel>

      {/* Confirmation Modals */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={dialogType === 'revoke' ? 'Revoke and Purge API Key?' : 'Manual Rotation of API Secret?'}
        description={
          dialogType === 'revoke'
            ? `Are you sure you want to permanently revoke and delete "${dialogSecret?.name}"? All integrated systems, runners, and agent pipelines utilizing this secret will break immediately.`
            : `Are you sure you want to trigger manual secret token rotation for "${dialogSecret?.name}"? We will generate a new secure hash token and deprecate the old credentials with a 30-minute fallback period.`
        }
        confirmText={dialogType === 'revoke' ? 'PERMANENTLY REVOKE' : 'ROTATE NOW'}
        intent={dialogType === 'revoke' ? 'danger' : 'warning'}
        loading={dialogLoading}
      />

      {/* Register Secret Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/10 bg-[#0b0c10] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider text-left">
                Register Secure API Key
              </h3>
              <button 
                onClick={() => setRegisterOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRegisterSecret} className="p-6 flex flex-col gap-4 text-left">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Secret Key Name</label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="e.g. OpenAI GPT-4 Token"
                  className="w-full px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">API Token Value</label>
                <input
                  type="password"
                  required
                  value={registerSecret}
                  onChange={(e) => setRegisterSecret(e.target.value)}
                  placeholder="e.g. sk-proj-..."
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
                  {registerLoading ? 'STORING...' : 'STORE SECURE KEY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
