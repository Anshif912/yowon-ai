import React, { useState, useMemo, useEffect } from 'react'
import {
  Globe,
  Plus,
  Play,
  RotateCw,
  Trash2,
  SlidersHorizontal,
  Search,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  ArrowRight
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  DataTable,
  InspectorPanel,
  ConfirmationDialog,
  LoadingSkeleton,
  SplitView,
  ActionPanel,
  EmptyState
} from '../../components/enterprise'

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  status: 'active' | 'failing' | 'inactive'
  secret: string
  created: string
  deliveriesCount: number
  failedCount: number
}

interface DeliveryLog {
  id: string
  endpointId: string
  status: number // e.g. 200, 500, 404
  timestamp: string
  method: string
  event: string
  latency: string
  retryCount: number
  inDlq: boolean
}

const INITIAL_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'wh-1',
    name: 'Slack Alerts Channel Dispatcher',
    url: 'https://hooks.slack.com/services/your/slack/webhook/url',
    status: 'active',
    secret: 'whsec_slack_2A9d8F1c3B7e6A4d',
    created: '2026-04-10',
    deliveriesCount: 3410,
    failedCount: 0
  },
  {
    id: 'wh-2',
    name: 'Jira Automations Webhook Tunnel',
    url: 'https://api.atlassian.com/webhooks/v1/trigger/jira-sync-0x2A',
    status: 'failing',
    secret: 'whsec_jira_9f8d7c6b5a4a3a2b',
    created: '2026-05-18',
    deliveriesCount: 1204,
    failedCount: 42
  },
  {
    id: 'wh-3',
    name: 'Azure DevOps Pipeline Dispatcher',
    url: 'https://dev.azure.com/yowon-ai/_apis/public/webhooks/receiver',
    status: 'active',
    secret: 'whsec_azure_8a7a6a5a4a3a2a1a',
    created: '2026-06-02',
    deliveriesCount: 198,
    failedCount: 1
  }
]

const MOCK_DELIVERIES: DeliveryLog[] = [
  { id: 'd-1', endpointId: 'wh-1', status: 200, timestamp: '3 mins ago', method: 'POST', event: 'vulnerability.detected', latency: '45ms', retryCount: 0, inDlq: false },
  { id: 'd-2', endpointId: 'wh-2', status: 500, timestamp: '12 mins ago', method: 'POST', event: 'secret_rotated', latency: '820ms', retryCount: 3, inDlq: true },
  { id: 'd-3', endpointId: 'wh-1', status: 200, timestamp: '22 mins ago', method: 'POST', event: 'pipeline.completed', latency: '32ms', retryCount: 0, inDlq: false },
  { id: 'd-4', endpointId: 'wh-3', status: 200, timestamp: '45 mins ago', method: 'POST', event: 'vulnerability.detected', latency: '58ms', retryCount: 0, inDlq: false },
  { id: 'd-5', endpointId: 'wh-2', status: 404, timestamp: '1 hour ago', method: 'POST', event: 'connector.disabled', latency: '120ms', retryCount: 5, inDlq: true }
]

import { api } from '../../api/api'
import { useWorkspace } from '../../components/auth/WorkspaceContext'

export default function WebhooksPage() {
  const { currentWorkspace } = useWorkspace()
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'dlq'>('all')

  // Secret visibility controls
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({})

  // Selected delivery details for payload inspector
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLog | null>(null)

  // Dialog actions
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'rotate' | 'delete' | 'redeliver' | null>(null)
  const [targetEndpoint, setTargetEndpoint] = useState<WebhookEndpoint | null>(null)
  const [targetDelivery, setTargetDelivery] = useState<DeliveryLog | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Register Webhook states
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerUrl, setRegisterUrl] = useState('')
  const [registerEvents, setRegisterEvents] = useState<string[]>(['DNA_GENERATED', 'DECISION_COMPLETED'])
  const [registerLoading, setRegisterLoading] = useState(false)

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const resWebhooks = await api.get('/webhooks')
      const mappedEps = resWebhooks.data.map((w: any) => ({
        id: w.uuid,
        name: `Webhook ${w.uuid.slice(0, 8)}`,
        url: w.target_url,
        status: w.status === 'ACTIVE' ? 'active' : 'inactive',
        secret: w.hmac_key,
        created: new Date(w.created_at).toISOString().split('T')[0],
        deliveriesCount: 0,
        failedCount: 0
      }))
      setEndpoints(mappedEps)
      
      const resDeliveries = await api.get('/webhooks/deliveries')
      const mappedDels = resDeliveries.data.map((d: any) => ({
        id: d.uuid,
        endpointId: d.webhook_id,
        status: d.response_code || 0,
        timestamp: new Date(d.attempted_at).toLocaleTimeString(),
        method: 'POST',
        event: d.event_name,
        latency: '45ms',
        retryCount: d.retry_count,
        inDlq: d.status === 'FAILED' && d.retry_count >= 3
      }))
      setDeliveries(mappedDels)
      
      // Update delivery counts in endpoints dynamically
      setEndpoints(prev => prev.map(ep => {
        const dels = mappedDels.filter((d: any) => d.endpointId === ep.id)
        const fails = dels.filter((d: any) => d.status !== 200)
        return {
          ...ep,
          deliveriesCount: dels.length,
          failedCount: fails.length,
          status: fails.length > 0 ? 'failing' : 'active'
        }
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [currentWorkspace])

  const handleReload = () => {
    fetchWebhooks()
  }

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) =>
      ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [endpoints, searchQuery])

  // Filter deliveries based on activeTab (All vs DLQ)
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (activeTab === 'dlq') return d.inDlq
      return true
    })
  }, [deliveries, activeTab])

  const toggleSecretReveal = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Trigger modal controls
  const triggerEndpointAction = (e: React.MouseEvent, ep: WebhookEndpoint, type: 'rotate' | 'delete') => {
    e.stopPropagation()
    setTargetEndpoint(ep)
    setDialogType(type)
    setDialogOpen(true)
  }

  const triggerRedeliverAction = (e: React.MouseEvent, del: DeliveryLog) => {
    e.stopPropagation()
    setTargetDelivery(del)
    setDialogType('redeliver')
    setDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    setDialogLoading(true)
    try {
      if (dialogType === 'delete' && targetEndpoint) {
        await api.delete(`/webhooks/${targetEndpoint.id}`)
      } else if (dialogType === 'redeliver' && targetDelivery) {
        await api.post(`/webhooks/replays?delivery_id=${targetDelivery.id}`)
      }
      await fetchWebhooks()
    } catch (err) {
      console.error(err)
    } finally {
      setDialogLoading(false)
      setDialogOpen(false)
      setTargetEndpoint(null)
      setTargetDelivery(null)
      setDialogType(null)
    }
  }

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    try {
      await api.post('/webhooks', {
        target_url: registerUrl,
        events: registerEvents
      })
      setRegisterUrl('')
      setRegisterOpen(false)
      await fetchWebhooks()
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
        title="Outbound Webhook Streams"
        description="Configure dispatch endpoints payload events triggers, examine HTTP response status logs, and configure HMAC signatures encryption keys."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Webhooks' }
        ]}
        status={{ label: 'DISPATCHER RUNNING', type: 'success' }}
        actions={
          <button 
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all duration-150"
          >
            <Plus size={13} />
            ADD WEBHOOK ENDPOINT
          </button>
        }
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Split View Content Layout */}
        <SplitView
          leftPanel={
            <div className="flex flex-col gap-6">
              
              {/* Webhook Endpoints List Card */}
              <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Webhook Endpoints
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Configure target URLs receiving system transactions payloads
                    </p>
                  </div>
                </div>

                {filteredEndpoints.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {filteredEndpoints.map((ep) => {
                      const isRevealed = revealedSecrets[ep.id] || false
                      return (
                        <div key={ep.id} className="border border-white/5 bg-zinc-950/40 p-4 rounded-xl flex flex-col gap-3 group relative hover:border-cyan-500/20 transition-all duration-200">
                          
                          {/* Endpoint Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-0.5 max-w-[70%]">
                              <span className="font-bold text-zinc-200 text-sm truncate">{ep.name}</span>
                              <span className="font-mono text-zinc-500 text-[10px] truncate max-w-full block" title={ep.url}>
                                {ep.url}
                              </span>
                            </div>
                            <StatusBadge status={ep.status} size="xs" />
                          </div>

                          {/* HMAC Key */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] font-mono select-none">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">HMAC SECRET:</span>
                              <span className="text-zinc-300">
                                {isRevealed ? ep.secret : '••••••••••••••••••••••••'}
                              </span>
                              <button
                                onClick={() => toggleSecretReveal(ep.id)}
                                className="text-zinc-500 hover:text-white transition-colors duration-150"
                                title={isRevealed ? 'Mask Signature' : 'Reveal Signature'}
                              >
                                {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>

                            {/* Trigger Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => triggerEndpointAction(e, ep, 'rotate')}
                                className="p-1 text-zinc-500 hover:text-cyan-400 transition-colors duration-150"
                                title="Rotate Signing Secret"
                              >
                                <RefreshCw size={11} />
                              </button>
                              <button
                                onClick={(e) => triggerEndpointAction(e, ep, 'delete')}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors duration-150"
                                title="Delete Webhook"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Stats counter */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 border-t border-white/5 pt-2 select-none">
                            <span>TOTAL SUCCESS: <span className="font-bold text-emerald-400">{ep.deliveriesCount}</span></span>
                            <span>FAILURES (24h): <span className={`font-bold ${ep.failedCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>{ep.failedCount}</span></span>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState title="NO ENDPOINTS REGISTERED" description="Register a webhook endpoint to start forwarding system transaction signals." variant="simple" />
                )}
              </div>

            </div>
          }
          rightPanel={
            <div className="flex flex-col border border-white/5 bg-[#0b0c10]/60 rounded-xl p-6 text-left relative overflow-hidden">
              {/* Top glow border decorator */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Recent Delivery Logs
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Real-time status tracking for outbound payloads
                  </p>
                </div>

                <div className="flex items-center gap-1 border border-white/5 bg-zinc-950 p-0.5 rounded-lg shrink-0">
                  {(['all', 'dlq'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase transition-colors duration-150 ${
                        activeTab === tab
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      {tab === 'dlq' ? 'Dead letter Queue' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDeliveries.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredDeliveries.map((d) => {
                    const isSuccess = d.status >= 200 && d.status < 300
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDelivery(d)}
                        className={`p-3 rounded-lg border border-white/5 hover:border-cyan-500/20 bg-zinc-950/20 flex items-center justify-between gap-4 cursor-pointer transition-all duration-150 ${
                          d.inDlq ? 'border-red-500/25 bg-red-500/[0.01]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="shrink-0">
                            {isSuccess ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <XCircle size={14} className="text-red-400" />
                            )}
                          </div>
                          <div className="flex flex-col truncate text-left">
                            <span className="text-xs font-bold text-zinc-300 truncate font-mono">
                              {d.event}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500 leading-none mt-0.5">
                              {d.method} • {d.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 select-none">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isSuccess ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            HTTP {d.status}
                          </span>
                          
                          {d.inDlq && (
                            <button
                              onClick={(e) => triggerRedeliverAction(e, d)}
                              className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all duration-150"
                              title="Force Manual Redelivery"
                            >
                              <RotateCw size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="NO PAYLOAD LOGS FOUND" description="No transactions logged for this selected scope." variant="simple" />
              )}

            </div>
          }
          leftWidth="w-full xl:w-7/12"
          rightWidth="w-full xl:w-5/12"
          gap="gap-6"
        />

      </div>

      {/* Webhook Payload Details Inspector Panel */}
      <InspectorPanel
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        title={selectedDelivery?.event || ''}
        subtitle="POST Outbound Dispatch Details"
        actions={
          selectedDelivery?.inDlq ? (
            <button
              onClick={(e) => triggerRedeliverAction(e, selectedDelivery)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-all duration-150"
            >
              <RotateCw size={11} />
              DISPATCH RETRY
            </button>
          ) : undefined
        }
      >
        {selectedDelivery && (
          <div className="flex flex-col gap-6 text-left select-none">
            
            {/* Delivery Stats Card */}
            <div className="flex flex-col border border-white/5 bg-zinc-950/40 p-4 rounded-xl text-xs font-mono">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-zinc-500">TRANSACTION ID:</span>
                <span className="text-zinc-300 font-semibold">{selectedDelivery.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-zinc-500">RESPONSE STATUS:</span>
                <span className={`font-bold ${selectedDelivery.status === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                  HTTP {selectedDelivery.status}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-zinc-500">API RETRIES COUNT:</span>
                <span className="text-zinc-300 font-semibold">{selectedDelivery.retryCount} / 5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">RESPONSE LATENCY:</span>
                <span className="text-zinc-300 font-semibold">{selectedDelivery.latency}</span>
              </div>
            </div>

            {/* Mock JSON Payload representation */}
            <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold font-mono uppercase tracking-wider text-[10px]">
                <Terminal size={12} className="text-cyan-400" />
                <span>Payload Content Body (JSON)</span>
              </div>
              <pre className="p-3 bg-zinc-950 border border-white/5 text-[10px] font-mono text-cyan-400 rounded-lg overflow-x-auto leading-relaxed max-w-full">
{`{
  "event_type": "${selectedDelivery.event}",
  "timestamp": "${new Date(Date.now() - 3600000).toISOString()}",
  "workspace_id": "yowon-sentinel-dev",
  "actor": "Background-Worker-2",
  "payload": {
    "status": "COMPLIANCE_STATE_CHANGED",
    "details": "AST vulnerability scanner reports active pipeline updates completed."
  }
}`}
              </pre>
            </div>

          </div>
        )}
      </InspectorPanel>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={
          dialogType === 'delete'
            ? 'Revoke Webhook Endpoint?'
            : dialogType === 'rotate'
            ? 'Rotate Webhook Signature Secret?'
            : 'Force Manual Redelivery Dispatch?'
        }
        description={
          dialogType === 'delete'
            ? `Are you sure you want to permanently delete Webhook "${targetEndpoint?.name}"? Outstanding outbound dispatch requests in retry phases will be discarded.`
            : dialogType === 'rotate'
            ? `Are you sure you want to rotate the HMAC Signing Secret for "${targetEndpoint?.name}"? You will need to configure your web server with the new token hash signatures immediately.`
            : `Are you sure you want to bypass the Dead-Letter Queue policy cooldown and force manual API redelivery for transaction "${targetDelivery?.id}"?`
        }
        confirmText={
          dialogType === 'delete' ? 'YES, REVOKE' : dialogType === 'rotate' ? 'ROTATE SECRET' : 'FORCE DISPATCH NOW'
        }
        intent={dialogType === 'delete' ? 'danger' : dialogType === 'rotate' ? 'warning' : 'info'}
        loading={dialogLoading}
      />

      {/* Register Webhook Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/10 bg-[#0b0c10] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider text-left">
                Register Webhook Endpoint
              </h3>
              <button 
                onClick={() => setRegisterOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRegisterWebhook} className="p-6 flex flex-col gap-4 text-left">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Target Receiver URL</label>
                <input
                  type="url"
                  required
                  value={registerUrl}
                  onChange={(e) => setRegisterUrl(e.target.value)}
                  placeholder="e.g. https://api.mycompany.com/webhook"
                  className="w-full px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Subscribe Events</label>
                <div className="flex flex-col gap-2 bg-zinc-900 p-3 border border-white/10 rounded-lg max-h-[150px] overflow-y-auto">
                  {['DNA_GENERATED', 'DECISION_COMPLETED', 'CONNECTOR_SYNCED', 'SECRET_ROTATED'].map((evt) => (
                    <label key={evt} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registerEvents.includes(evt)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRegisterEvents(prev => [...prev, evt])
                          } else {
                            setRegisterEvents(prev => prev.filter(x => x !== evt))
                          }
                        }}
                        className="rounded border-white/10 bg-zinc-950 text-cyan-400 focus:ring-cyan-500 focus:ring-opacity-25"
                      />
                      <span className="font-mono text-[10px]">{evt}</span>
                    </label>
                  ))}
                </div>
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
                  {registerLoading ? 'CREATING...' : 'ADD WEBHOOK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
