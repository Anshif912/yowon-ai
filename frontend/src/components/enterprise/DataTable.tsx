import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T, value: any) => React.ReactNode
  className?: string
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  rowIdKey: keyof T
  loading?: boolean
  
  // Selection
  selectedRowIds?: (string | number)[]
  onRowSelectionChange?: (selectedIds: (string | number)[]) => void
  
  // Sorting
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void
  
  // Pagination
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  
  // Row actions
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export default function DataTable<T>({
  data = [],
  columns,
  rowIdKey,
  loading = false,
  selectedRowIds,
  onRowSelectionChange,
  sortKey,
  sortDirection,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  emptyMessage = 'No matching database records found',
}: DataTableProps<T>) {
  
  // Local sorting states in case parent does not provide controlled props
  const [localSortKey, setLocalSortKey] = useState<string | undefined>(sortKey)
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc' | undefined>(sortDirection)
  
  // Local pagination state
  const [localPage, setLocalPage] = useState<number>(1)
  const itemsPerPage = 10

  const activeSortKey = sortKey !== undefined ? sortKey : localSortKey
  const activeSortDir = sortDirection !== undefined ? sortDirection : localSortDir
  const activePage = currentPage !== undefined ? currentPage : localPage

  // Handle Sort Toggle
  const handleSort = (columnKey: string) => {
    let nextDirection: 'asc' | 'desc' = 'asc'
    if (activeSortKey === columnKey) {
      nextDirection = activeSortDir === 'asc' ? 'desc' : 'asc'
    }

    if (onSortChange) {
      onSortChange(columnKey, nextDirection)
    } else {
      setLocalSortKey(columnKey)
      setLocalSortDir(nextDirection)
    }
  }

  // Local Sort logic if no controlled pagination / sorting exists
  const sortedData = useMemo(() => {
    if (onSortChange || !activeSortKey || !activeSortDir) return data

    const sorted = [...data]
    sorted.sort((a: any, b: any) => {
      const aVal = a[activeSortKey]
      const bVal = b[activeSortKey]

      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return activeSortDir === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return activeSortDir === 'asc'
        ? (aVal > bVal ? 1 : -1)
        : (aVal < bVal ? 1 : -1)
    })
    return sorted
  }, [data, activeSortKey, activeSortDir, onSortChange])

  // Local Pagination Logic if no controlled props are present
  const paginatedData = useMemo(() => {
    if (onPageChange) return sortedData
    
    const start = (activePage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedData.slice(start, end)
  }, [sortedData, activePage, onPageChange])

  const calculatedTotalPages = useMemo(() => {
    if (totalPages !== undefined) return totalPages
    return Math.ceil(data.length / itemsPerPage) || 1
  }, [data.length, totalPages])

  const handlePageChange = (page: number) => {
    const target = Math.max(1, Math.min(page, calculatedTotalPages))
    if (onPageChange) {
      onPageChange(target)
    } else {
      setLocalPage(target)
    }
  }

  // Selection Checkbox Logic
  const allRowIds = useMemo(() => {
    return data.map(item => item[rowIdKey] as unknown as string | number)
  }, [data, rowIdKey])

  const isAllSelected = useMemo(() => {
    if (!selectedRowIds || selectedRowIds.length === 0) return false
    return allRowIds.every(id => selectedRowIds.includes(id))
  }, [selectedRowIds, allRowIds])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onRowSelectionChange) return
    if (e.target.checked) {
      onRowSelectionChange(allRowIds)
    } else {
      onRowSelectionChange([])
    }
  }

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string | number) => {
    e.stopPropagation()
    if (!onRowSelectionChange || !selectedRowIds) return

    if (e.target.checked) {
      onRowSelectionChange([...selectedRowIds, id])
    } else {
      onRowSelectionChange(selectedRowIds.filter(itemId => itemId !== id))
    }
  }

  return (
    <div className="relative flex flex-col w-full border border-white/5 rounded-xl bg-[#0b0c10]/70 backdrop-blur-md overflow-hidden select-none">
      
      {/* Table Main Area */}
      <div className="w-full overflow-x-auto min-h-[300px] relative">
        <table className="w-full border-collapse text-left text-xs font-sans text-zinc-300">
          
          {/* Header */}
          <thead className="bg-[#05070a] border-b border-white/5 text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
            <tr>
              {/* Select All Checkbox */}
              {onRowSelectionChange && (
                <th className="w-12 px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4.5 w-4.5 rounded border-zinc-700 bg-zinc-950 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-zinc-900 focus:outline-none cursor-pointer"
                  />
                </th>
              )}

              {/* Columns Header */}
              {columns.map((col) => {
                const isSorted = activeSortKey === col.key
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-6 py-4 font-bold ${col.className || ''} ${
                      col.sortable ? 'cursor-pointer hover:text-white select-none transition-colors duration-150' : ''
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="shrink-0 text-zinc-500">
                          {isSorted ? (
                            activeSortDir === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                          ) : (
                            <ArrowUpDown size={12} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-white/5">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const rowId = row[rowIdKey] as unknown as string | number
                const isSelected = selectedRowIds?.includes(rowId) || false

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors duration-150 ${
                      onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''
                    } ${isSelected ? 'bg-cyan-500/[0.02]' : ''}`}
                  >
                    {/* Row Select Checkbox */}
                    {onRowSelectionChange && (
                      <td className="w-12 px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(e, rowId)}
                          className="h-4.5 w-4.5 rounded border-zinc-700 bg-zinc-950 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-zinc-900 focus:outline-none cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Row Values */}
                    {columns.map((col) => {
                      const value = (row as any)[col.key]
                      return (
                        <td
                          key={col.key}
                          className={`px-6 py-4 truncate font-medium text-zinc-300 font-sans ${col.className || ''}`}
                        >
                          {col.render ? col.render(row, value) : (value != null ? String(value) : '-')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            ) : !loading ? (
              <tr>
                <td colSpan={columns.length + (onRowSelectionChange ? 1 : 0)} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-500">
                      Empty Result Set
                    </span>
                    <span className="text-xs text-zinc-500">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0b0c10]/40 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="flex items-center gap-3 bg-[#05070a]/90 border border-white/10 px-5 py-3 rounded-lg shadow-xl">
              <Loader2 className="animate-spin text-cyan-400 shrink-0" size={16} />
              <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400">
                SYNCING DATASTREAM...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      {calculatedTotalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[#05070a] border-t border-white/5 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span>Page</span>
            <span className="font-bold text-white">{activePage}</span>
            <span>of</span>
            <span className="font-bold text-white">{calculatedTotalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1 || loading}
              className="p-1.5 rounded-lg border border-white/5 bg-[#0b0c10] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1 || loading}
              className="p-1.5 rounded-lg border border-white/5 bg-[#0b0c10] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === calculatedTotalPages || loading}
              className="p-1.5 rounded-lg border border-white/5 bg-[#0b0c10] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => handlePageChange(calculatedTotalPages)}
              disabled={activePage === calculatedTotalPages || loading}
              className="p-1.5 rounded-lg border border-white/5 bg-[#0b0c10] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
