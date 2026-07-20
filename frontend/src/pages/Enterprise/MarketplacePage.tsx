import React, { useState, useEffect, useMemo } from 'react'
import {
  Download,
  ShieldCheck,
  Search,
  Plus,
  Play,
  RotateCw,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  Package,
  Layers,
  ArrowDownToLine,
  Trash,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  EmptyState,
  ConfirmationDialog,
  LoadingSkeleton
} from '../../components/enterprise'
import { api } from '../../api/api'

interface Extension {
  id: string
  name: string
  version: string
  publisher: string
  isVerified: boolean
  downloads: string
  rating: string
  description: string
  status: 'installed' | 'inactive' | 'not_installed'
  category: string
}

export default function MarketplacePage() {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'updates'>('all')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'plugin' | 'policy'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Confirmation Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'install' | 'update' | 'uninstall' | 'toggle' | null>(null)
  const [selectedExt, setSelectedExt] = useState<Extension | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Fetch extensions
  const fetchExtensions = async () => {
    try {
      setError(null)
      const res = await api.get('/marketplace')
      const raw = res.data || []
      
      const mapped: Extension[] = raw.map((item: any) => ({
        id: item.uuid,
        name: item.name,
        version: 'v1.0.0',
        publisher: item.publisher,
        isVerified: item.is_verified,
        downloads: item.downloads >= 1000 ? `${(item.downloads/1000).toFixed(1)}k` : String(item.downloads),
        rating: item.trust_score ? item.trust_score.toFixed(1) : '5.0',
        description: item.item_type === 'plugin'
          ? `Verified ${item.name} agent extension providing real-time data ingestion and workflow triggers.`
          : `Customized policy rules package defining automated validation and scan postures.`,
        status: item.status as any, // 'installed' | 'inactive' | 'not_installed'
        category: item.item_type
      }))
      setExtensions(mapped)
    } catch (err: any) {
      console.error("Error fetching extensions:", err)
      setError(err?.response?.data?.detail || "Failed to load extensions catalog.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExtensions()
  }, [])

  const handleReload = () => {
    setLoading(true)
    fetchExtensions()
  }

  // Filter logic
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ext.publisher.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTab = activeTab === 'all'
        ? true
        : activeTab === 'installed'
          ? (ext.status === 'installed' || ext.status === 'inactive')
          : ext.status === 'inactive'

      const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory

      return matchesSearch && matchesTab && matchesCategory
    })
  }, [extensions, searchQuery, activeTab, selectedCategory])

  // Open dialog
  const triggerActionDialog = (e: React.MouseEvent, ext: Extension, type: 'install' | 'update' | 'uninstall' | 'toggle') => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedExt(ext)
    setDialogType(type)
    setDialogOpen(true)
  }

  // Confirm dialog execution
  const handleConfirmAction = async () => {
    if (!selectedExt || !dialogType) return
    setDialogLoading(true)

    try {
      if (dialogType === 'install') {
        await api.post(`/marketplace/${selectedExt.id}/install`)
      } else if (dialogType === 'uninstall') {
        await api.post(`/marketplace/${selectedExt.id}/uninstall`)
      } else if (dialogType === 'toggle') {
        await api.post(`/marketplace/${selectedExt.id}/toggle`)
      }
      
      // Refresh extensions state
      await fetchExtensions()
      setDialogOpen(false)
      setSelectedExt(null)
      setDialogType(null)
    } catch (err: any) {
      console.error(`Error performing action ${dialogType}:`, err)
      alert(err?.response?.data?.detail || `Failed to perform ${dialogType} action on extension.`)
    } finally {
      setDialogLoading(false)
    }
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title="Extensions Marketplace"
        description="Search, deploy, and configure verified agent plugins, static vulnerability analyzers, and team connectors."
        breadcrumbs={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Marketplace' }
        ]}
        status={{ label: 'SYSTEM PLUGINS COMPLIANT', type: 'success' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {error && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs font-mono">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={handleReload} className="underline hover:text-red-300 ml-auto cursor-pointer">Retry</button>
          </div>
        )}

        {/* Search & Tabs bar */}
        <div className="flex flex-col gap-4">
          <SearchToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            placeholder="Search extensions directory..."
            onReload={handleReload}
            isLoading={loading}
            quickActions={
              <div className="flex items-center gap-1 border border-white/5 bg-zinc-950/60 p-1 rounded-lg">
                {(['all', 'installed', 'updates'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md uppercase transition-colors duration-150 cursor-pointer ${
                      activeTab === tab
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    {tab === 'updates' ? 'UPDATES AVAILABLE' : tab}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        {/* Categories Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4 select-none">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mr-2">CATEGORIES:</span>
          {(['all', 'plugin', 'policy'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-[10.5px] font-mono font-bold rounded-lg border transition-all duration-150 cursor-pointer uppercase ${
                selectedCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                  : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat === 'plugin' ? 'Plugins / Agents' : 'Policies / Rules'}
            </button>
          ))}
        </div>

        {/* Extensions Grid */}
        {loading ? (
          <LoadingSkeleton variant="grid" rows={6} columns={3} />
        ) : filteredExtensions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className="group relative flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl overflow-hidden hover:border-cyan-500/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Header info */}
                <div className="flex items-start justify-between p-6 border-b border-white/5 shrink-0 select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 text-zinc-400 group-hover:text-cyan-400 transition-colors duration-150 shrink-0">
                      <Package size={18} />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {ext.name}
                        </h4>
                        {ext.isVerified && (
                          <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                        )}
                        {ext.status === 'installed' && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[8px] uppercase font-bold">Active</span>
                        )}
                        {ext.status === 'inactive' && (
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-mono text-[8px] uppercase font-bold">Disabled</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                        PUBLISHER: {ext.publisher}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 flex-grow flex flex-col text-left">
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium mb-4 flex-1">
                    {ext.description}
                  </p>
                  
                  {/* Metadata labels */}
                  <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs font-mono select-none">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">DOWNLOADS</span>
                      <span className="font-bold text-zinc-300 inline-flex items-center gap-0.5">
                        <Download size={10} className="text-zinc-500" />
                        {ext.downloads}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">VERSION</span>
                      <span className="font-bold text-zinc-300">{ext.version}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">TRUST SCORE</span>
                      <span className="font-bold text-zinc-300">★ {ext.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-[#05070a] border-t border-white/5 flex items-center justify-between shrink-0 select-none">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                    CATEGORY: {ext.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {ext.status === 'not_installed' && (
                      <button
                        onClick={(e) => triggerActionDialog(e, ext, 'install')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg transition-colors duration-150 cursor-pointer"
                      >
                        <ArrowDownToLine size={12} />
                        INSTALL
                      </button>
                    )}

                    {ext.status === 'inactive' && (
                      <>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'toggle')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors duration-150 cursor-pointer"
                        >
                          <ToggleRight size={12} />
                          ENABLE
                        </button>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'uninstall')}
                          className="p-1.5 text-zinc-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg hover:bg-red-500/5 transition-all duration-150 cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      </>
                    )}

                    {ext.status === 'installed' && (
                      <>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'toggle')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 rounded-lg transition-colors duration-150 cursor-pointer"
                        >
                          <ToggleLeft size={12} />
                          DISABLE
                        </button>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'uninstall')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border border-zinc-850 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 rounded-lg transition-all duration-150 cursor-pointer"
                        >
                          <Trash size={11} />
                          UNINSTALL
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="NO PLUGINS FOUND"
            description="Your search criteria did not match any extensions in our catalog. Try expanding filters or using simpler keywords."
            action={
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveTab('all')
                }}
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
              >
                RESET SEARCH
              </button>
            }
          />
        )}

      </div>

      {/* Action Dialog */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmAction}
        title={
          dialogType === 'install'
            ? 'Install Marketplace Extension?'
            : dialogType === 'toggle'
            ? `${selectedExt?.status === 'installed' ? 'Disable' : 'Enable'} Marketplace Extension?`
            : 'Uninstall Extension from Workspace?'
        }
        description={
          dialogType === 'install'
            ? `Are you sure you want to install and activate "${selectedExt?.name}"? It will be granted permissions matching its publisher scope.`
            : dialogType === 'toggle'
            ? `Are you sure you want to ${selectedExt?.status === 'installed' ? 'disable' : 'enable'} "${selectedExt?.name}"?`
            : `Are you sure you want to uninstall "${selectedExt?.name}"? You will lose its custom scanners telemetry configuration data.`
        }
        confirmText={
          dialogType === 'install' ? 'CONFIRM INSTALL' : dialogType === 'toggle' ? (selectedExt?.status === 'installed' ? 'DISABLE' : 'ENABLE') : 'YES, UNINSTALL'
        }
        intent={dialogType === 'uninstall' ? 'danger' : 'info'}
        loading={dialogLoading}
      />
    </div>
  )
}
