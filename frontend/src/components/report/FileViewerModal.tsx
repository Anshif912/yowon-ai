import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code2, Search, FileText, AlignLeft, ShieldCheck, HelpCircle } from 'lucide-react'
import { api } from '../../api/api'

interface FileViewerModalProps {
  projectId: string
  path: string | null
  onClose: () => void
}

export default function FileViewerModal({ projectId, path, onClose }: FileViewerModalProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchInside, setSearchInside] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  
  const codeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!path) {
      setSelectedFile(null)
      return
    }

    const fetchFile = async () => {
      setLoading(true)
      setSearchInside('')
      setScrollTop(0)
      if (codeContainerRef.current) {
        codeContainerRef.current.scrollTop = 0
      }
      try {
        const res = await api.get(`/evaluations/${projectId}/file/${encodeURIComponent(path)}`)
        if (res.data.success) {
          setSelectedFile(res.data.data)
        } else {
          setSelectedFile(res.data)
        }
      } catch (err) {
        setSelectedFile({
          path,
          content: '// Unable to retrieve file source content from repository cache.',
          symbols: [],
          metrics: {},
          intelligence: {}
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFile()
  }, [projectId, path])

  // ESC key close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const LINE_HEIGHT = 18 // px
  const CONTAINER_HEIGHT = 380 // px

  const virtualData = useMemo(() => {
    if (!selectedFile || !selectedFile.content) return { lines: [], height: 0 }
    let rawLines = selectedFile.content.split('\n')
    
    if (searchInside) {
      rawLines = rawLines.map((line: string, idx: number) => {
        if (line.toLowerCase().includes(searchInside.toLowerCase())) {
          return { text: line, index: idx + 1, match: true }
        }
        return { text: line, index: idx + 1, match: false }
      })
    } else {
      rawLines = rawLines.map((line: string, idx: number) => ({
        text: line,
        index: idx + 1,
        match: false
      }))
    }

    return {
      lines: rawLines,
      height: rawLines.length * LINE_HEIGHT
    }
  }, [selectedFile, searchInside])

  const visibleLines = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - 5)
    const endIdx = Math.min(
      virtualData.lines.length,
      Math.ceil((scrollTop + CONTAINER_HEIGHT) / LINE_HEIGHT) + 5
    )
    
    return virtualData.lines.slice(startIdx, endIdx).map((line: any, idx: number) => ({
      ...line,
      top: (startIdx + idx) * LINE_HEIGHT
    }))
  }, [scrollTop, virtualData])

  const jumpToLine = (lineNum: number) => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = (lineNum - 1) * LINE_HEIGHT
    }
  }

  if (!path) return null

  const breadcrumbs = path.split('/')
  const fileIntel = selectedFile?.intelligence || {}

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl h-[90vh] bg-[#0c0d13] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-2xl font-mono text-[10px] text-white"
        >
          {/* Header Row */}
          <div className="bg-white/[0.03] border-b border-white/[0.06] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText size={14} className="text-cyan-400" />
              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span>{b}</span>
                    {i < breadcrumbs.length - 1 && <span>/</span>}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
              <span className="text-zinc-500 uppercase tracking-widest text-[8px] animate-pulse">Loading Source Cache...</span>
            </div>
          ) : selectedFile ? (
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
              {/* Code viewer viewport (8 cols) */}
              <div className="xl:col-span-8 flex flex-col border-r border-white/[0.06] overflow-hidden">
                {/* Search Bar */}
                <div className="bg-white/[0.02] border-b border-white/[0.04] p-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Code2 size={11} className="text-cyan-300" /> code_virtual_viewport
                  </span>
                  <div className="relative">
                    <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search inside file..."
                      value={searchInside}
                      onChange={e => setSearchInside(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-[9px] text-white focus:outline-none focus:border-cyan-500/50 w-44"
                    />
                  </div>
                </div>

                {/* Scroller container */}
                <div
                  ref={codeContainerRef}
                  onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                  className="flex-1 overflow-y-auto overflow-x-auto relative bg-[#040912]/80 min-h-[300px]"
                >
                  <div style={{ height: `${virtualData.height}px`, position: 'relative' }}>
                    {visibleLines.map((line: any) => (
                      <div
                        key={line.index}
                        className={`absolute left-0 w-full flex items-center hover:bg-white/[0.02] pl-2 ${
                          line.match ? 'bg-cyan-500/15 border-l-2 border-cyan-400 pl-1.5' : ''
                        }`}
                        style={{ top: `${line.top}px`, height: `${LINE_HEIGHT}px` }}
                      >
                        <span className="w-10 text-slate-600 text-right select-none text-[8.5px] border-r border-white/5 pr-2 mr-3 font-mono">
                          {line.index}
                        </span>
                        <span className="text-slate-300 font-mono whitespace-pre select-text">
                          {line.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar metadata panel (4 cols) */}
              <div className="xl:col-span-4 p-5 flex flex-col gap-4 overflow-y-auto bg-black/[0.15]">
                {/* File Intelligence */}
                <div className="glass-card p-4 border border-white/5 space-y-3 font-sans">
                  <h4 className="text-white text-xs font-bold font-display border-b border-white/5 pb-2">File Intelligence</h4>
                  <div className="space-y-3 leading-relaxed text-zinc-400">
                    <div>
                      <span className="text-zinc-600 text-[8px] font-mono block uppercase">Purpose</span>
                      <p className="mt-0.5">{fileIntel.purpose || 'Implements core service adapters.'}</p>
                    </div>

                    <div>
                      <span className="text-zinc-600 text-[8px] font-mono block uppercase">Architecture Layer</span>
                      <span className="text-cyan-400 font-bold block mt-0.5">{fileIntel.layer || 'Business Logic Layer'}</span>
                    </div>

                    <div>
                      <span className="text-zinc-600 text-[8px] font-mono block uppercase">DB Persistence</span>
                      <span className="text-emerald-400 block mt-0.5">{fileIntel.db_usage || 'No direct active queries.'}</span>
                    </div>

                    <div>
                      <span className="text-zinc-600 text-[8px] font-mono block uppercase">AI Council Engagement</span>
                      <span className="text-violet-300 font-bold block mt-0.5">{fileIntel.ai_usage || 'No AI integrations.'}</span>
                    </div>
                  </div>
                </div>

                {/* Symbols outline */}
                <div className="glass-card p-4 border border-white/5 flex flex-col max-h-[220px]">
                  <h4 className="text-white text-xs font-bold font-display border-b border-white/5 pb-2 flex items-center gap-1.5">
                    <AlignLeft size={13} className="text-amber-300" /> Symbol Outline
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-1 mt-2 font-mono">
                    {selectedFile.symbols && selectedFile.symbols.length > 0 ? (
                      selectedFile.symbols.map((sym: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => jumpToLine(sym.line_start)}
                          className="flex justify-between items-center py-1 hover:bg-white/5 px-2 rounded cursor-pointer text-slate-300 transition-colors"
                        >
                          <span className="truncate max-w-[70%] font-bold">{sym.name}</span>
                          <span className="text-cyan-400 shrink-0">L{sym.line_start}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-600 italic py-2">No class/function definitions parsed.</div>
                    )}
                  </div>
                </div>

                {/* File Metrics */}
                {selectedFile.metrics && Object.keys(selectedFile.metrics).length > 0 && (
                  <div className="glass-card p-4 border border-white/5 space-y-2 font-mono">
                    <h4 className="text-white text-xs font-bold font-display border-b border-white/5 pb-2">File Metrics</h4>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      {Object.entries(selectedFile.metrics).map(([key, val]: any) => (
                        <div key={key} className="p-2 border border-white/5 bg-white/[0.01] rounded-lg">
                          <span className="text-zinc-500 block uppercase scale-90 origin-left">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white font-bold block mt-0.5">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <HelpCircle size={24} className="text-zinc-500" />
              <span className="text-zinc-400">File not found in cached snapshots.</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
