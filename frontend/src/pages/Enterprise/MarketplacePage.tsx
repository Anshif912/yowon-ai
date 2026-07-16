import React, { useState, useMemo } from 'react'
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
  Trash
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  StatusBadge,
  EmptyState,
  ConfirmationDialog,
  LoadingSkeleton
} from '../../components/enterprise'

interface Extension {
  id: string
  name: string
  version: string
  publisher: string
  isVerified: boolean
  downloads: string
  rating: string
  description: string
  status: 'installed' | 'update_available' | 'not_installed'
  category: 'scanners' | 'connectors' | 'analytics'
}

const INITIAL_EXTENSIONS: Extension[] = [
  {
    id: 'ext-1',
    name: 'CodeQL Security Scanner',
    version: 'v2.1.4',
    publisher: 'YOWON Core',
    isVerified: true,
    downloads: '12.8k',
    rating: '4.9',
    description: 'Deep code analysis agent plugin using semantic AST analysis patterns to capture vulnerabilities.',
    status: 'installed',
    category: 'scanners'
  },
  {
    id: 'ext-2',
    name: 'SonarQube Integration Tunnel',
    version: 'v1.0.8',
    publisher: 'SonarSource',
    isVerified: true,
    downloads: '8.4k',
    rating: '4.7',
    description: 'Synchronizes quality gates telemetry and static analysis reports into active repositories workspaces.',
    status: 'update_available',
    category: 'connectors'
  },
  {
    id: 'ext-3',
    name: 'Trivy Container Inspector',
    version: 'v3.0.2',
    publisher: 'Aqua Security',
    isVerified: true,
    downloads: '6.1k',
    rating: '4.8',
    description: 'Scans docker images filesystems and packages repositories for active OS dependencies CVE exploits.',
    status: 'installed',
    category: 'scanners'
  },
  {
    id: 'ext-4',
    name: 'OpenAI GPT-4o Connector',
    version: 'v1.4.0',
    publisher: 'OpenAI Verified',
    isVerified: true,
    downloads: '25.4k',
    rating: '5.0',
    description: 'Enables advanced language synthesis models with workspace context window optimization.',
    status: 'installed',
    category: 'connectors'
  },
  {
    id: 'ext-5',
    name: 'LLM Response Hallucination Filter',
    version: 'v0.9.1',
    publisher: 'YOWON Labs',
    isVerified: false,
    downloads: '1.2k',
    rating: '4.2',
    description: 'Experimental filter calculating token probabilities to flag potential reasoning errors.',
    status: 'not_installed',
    category: 'analytics'
  },
  {
    id: 'ext-6',
    name: 'Kubernetes Cluster Telemetry',
    version: 'v1.2.0',
    publisher: 'CNCF Verified',
    isVerified: true,
    downloads: '4.9k',
    rating: '4.6',
    description: 'Aggregates node loads, service events, and pod states straight into your system logs.',
    status: 'not_installed',
    category: 'analytics'
  }
]

export default function MarketplacePage() {
  const [extensions, setExtensions] = useState<Extension[]>(INITIAL_EXTENSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'updates'>('all')
  const [loading, setLoading] = useState(false)
  
  // Confirmation Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'install' | 'update' | 'uninstall' | null>(null)
  const [selectedExt, setSelectedExt] = useState<Extension | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  const handleReload = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 700)
  }

  // Filter logic
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ext.publisher.toLowerCase().includes(searchQuery.toLowerCase())

      if (activeTab === 'all') return matchesSearch
      if (activeTab === 'installed') return matchesSearch && (ext.status === 'installed' || ext.status === 'update_available')
      if (activeTab === 'updates') return matchesSearch && ext.status === 'update_available'
      return matchesSearch
    })
  }, [extensions, searchQuery, activeTab])

  // Open dialog
  const triggerActionDialog = (e: React.MouseEvent, ext: Extension, type: 'install' | 'update' | 'uninstall') => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedExt(ext)
    setDialogType(type)
    setDialogOpen(true)
  }

  // Confirm dialog execution
  const handleConfirmAction = () => {
    if (!selectedExt || !dialogType) return
    setDialogLoading(true)

    setTimeout(() => {
      setExtensions(prev =>
        prev.map(ext => {
          if (ext.id !== selectedExt.id) return ext
          if (dialogType === 'install') return { ...ext, status: 'installed' as const }
          if (dialogType === 'update') return { ...ext, status: 'installed' as const, version: 'vLatest' }
          if (dialogType === 'uninstall') return { ...ext, status: 'not_installed' as const }
          return ext
        })
      )
      setDialogLoading(false)
      setDialogOpen(false)
      setSelectedExt(null)
      setDialogType(null)
    }, 1200)
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
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md uppercase transition-colors duration-150 ${
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
                      <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">RATING</span>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg transition-colors duration-150"
                      >
                        <ArrowDownToLine size={12} />
                        INSTALL
                      </button>
                    )}

                    {ext.status === 'update_available' && (
                      <>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'update')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors duration-150"
                        >
                          <RotateCw size={11} className="animate-pulse" />
                          UPDATE
                        </button>
                        <button
                          onClick={(e) => triggerActionDialog(e, ext, 'uninstall')}
                          className="p-1.5 text-zinc-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg hover:bg-red-500/5 transition-all duration-150"
                        >
                          <Trash size={12} />
                        </button>
                      </>
                    )}

                    {ext.status === 'installed' && (
                      <button
                        onClick={(e) => triggerActionDialog(e, ext, 'uninstall')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 rounded-lg transition-all duration-150"
                      >
                        <Trash size={11} />
                        UNINSTALL
                      </button>
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
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-colors duration-150"
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
            : dialogType === 'update'
            ? 'Install Extension Update?'
            : 'Uninstall Extension from Workspace?'
        }
        description={
          dialogType === 'install'
            ? `Are you sure you want to install and activate "${selectedExt?.name}"? It will be granted permissions matching its publisher scope.`
            : dialogType === 'update'
            ? `Are you sure you want to update "${selectedExt?.name}" to the latest verified version? This might cause a brief 5-second service refresh.`
            : `Are you sure you want to uninstall "${selectedExt?.name}"? You will lose its custom scanners telemetry configuration data.`
        }
        confirmText={
          dialogType === 'install' ? 'CONFIRM INSTALL' : dialogType === 'update' ? 'APPLY UPDATE' : 'YES, UNINSTALL'
        }
        intent={dialogType === 'uninstall' ? 'danger' : 'info'}
        loading={dialogLoading}
      />
    </div>
  )
}
