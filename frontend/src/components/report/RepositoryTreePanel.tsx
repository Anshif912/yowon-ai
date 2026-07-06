import React, { useState, useEffect } from 'react'
import { Folder, File, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/api'
import { TreeSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'

interface RepositoryTreePanelProps {
  projectId: string
}

function TreeContent({ projectId }: { projectId: string }) {
  const [treeData, setTreeData] = useState<any[]>([])
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({})
  const [selectedFile, setSelectedFile] = useState<any>(null)

  // Fetch root tree
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['repo-tree-root', projectId],
    queryFn: async () => {
      const res = await api.get(`/evaluations/${projectId}/repository-tree`)
      return res.data.data
    },
    enabled: !!projectId,
  })

  // Set treeData once loaded without double-fetching
  useEffect(() => {
    if (data) {
      setTreeData(data)
    }
  }, [data])

  const toggleFolder = async (path: string) => {
    const isExpanded = !!expandedPaths[path]
    setExpandedPaths(prev => ({ ...prev, [path]: !isExpanded }))

    if (!isExpanded) {
      try {
        const res = await api.get(`/evaluations/${projectId}/repository-tree?path=${encodeURIComponent(path)}`)
        if (res.data.success) {
          const children = res.data.data
          setTreeData(prev => {
            const updateNode = (nodes: any[]): any[] => {
              return nodes.map(node => {
                if (node.path === path) {
                  return { ...node, children }
                } else if (node.children) {
                  return { ...node, children: updateNode(node.children) }
                }
                return node
              })
            }
            return updateNode(prev)
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const loadFileContent = async (fpath: string) => {
    try {
      const res = await api.get(`/evaluations/${projectId}/file/${encodeURIComponent(fpath)}`)
      if (res.data.success) {
        setSelectedFile(res.data.data)
      } else {
        setSelectedFile(res.data)
      }
    } catch {
      setSelectedFile({
        path: fpath,
        content: '// Unable to load file source content from repository cache.'
      })
    }
  }

  if (isLoading) {
    return <TreeSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Repository File System" error={error} refetch={refetch} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-card lg:col-span-2 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted">Repository File System</h3>
        </div>
        
        {treeData.length === 0 ? (
          <p className="text-xs text-yowon-muted py-6 text-center">Repository tree is empty.</p>
        ) : (
          <div className="space-y-1 font-mono text-xs text-slate-300">
            {(() => {
              const renderNode = (node: any, depth = 0): React.ReactNode => {
                const isDir = node.type === 'dir'
                const isExpanded = !!expandedPaths[node.path]
                return (
                  <div key={node.path} className="select-none">
                    <div
                      className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 cursor-pointer ${
                        selectedFile?.path === node.path ? 'bg-cyan-500/10 text-cyan-300' : ''
                      }`}
                      style={{ paddingLeft: `${depth * 14 + 8}px` }}
                      onClick={() => isDir ? toggleFolder(node.path) : loadFileContent(node.path)}
                    >
                      {isDir ? (
                        <>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={14} className="text-amber-400" />
                        </>
                      ) : (
                        <>
                          <span className="w-3.5" />
                          <File size={14} className="text-cyan-300" />
                        </>
                      )}
                      <span className="truncate">{node.name}</span>
                    </div>

                    {isDir && isExpanded && node.children && (
                      <div className="border-l border-white/[0.06] ml-[15px]">
                        {node.children.map((c: any) => renderNode(c, depth + 1))}
                      </div>
                    )}
                  </div>
                )
              }
              return treeData.map(node => renderNode(node))
            })()}
          </div>
        )}
      </div>

      <div className="glass-card">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted mb-4">Symbol & Code Inspector</p>
        {selectedFile ? (
          <div className="space-y-4">
            <div>
              <p className="text-white font-bold truncate text-xs">{selectedFile.path.split('/').pop()}</p>
              <p className="text-[10px] text-yowon-muted truncate">{selectedFile.path}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-white/[0.02] border border-white/5 rounded px-2 py-1">
                <span className="text-yowon-muted block">Lines (LOC)</span>
                <span className="text-amber-300 font-bold text-sm">{selectedFile.metrics?.loc || selectedFile.loc || 0}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded px-2 py-1">
                <span className="text-yowon-muted block">Complexity</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedFile.metrics?.complexity?.cyclomatic_complexity || selectedFile.complexity || 1}
                </span>
              </div>
            </div>

            {selectedFile.evidence && selectedFile.evidence.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 space-y-2">
                <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">Traced Vulnerabilities / Rules</p>
                {selectedFile.evidence.map((ev: any) => (
                  <div key={ev.rule_id} className="text-[11px] leading-normal text-red-300">
                    <p className="font-bold">{ev.rule_id}</p>
                    <p className="text-yowon-muted">Line {ev.line_start}-{ev.line_end} (Confidence: {Math.round(ev.confidence * 100)}%)</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-[10px] overflow-x-auto max-h-[300px] leading-relaxed text-slate-300">
              <pre><code>{selectedFile.content}</code></pre>
            </div>
          </div>
        ) : (
          <div className="text-yowon-muted text-xs py-12 text-center">
            Select a source file in the explorer tree to inspect its AST elements and metrics.
          </div>
        )}
      </div>
    </div>
  )
}

export default function RepositoryTreePanel({ projectId }: RepositoryTreePanelProps) {
  return (
    <ErrorBoundary name="Repository Tree Explorer">
      <TreeContent projectId={projectId} />
    </ErrorBoundary>
  )
}
