import React from 'react'
import { Search, SlidersHorizontal, RotateCw, Loader2 } from 'lucide-react'

export interface SearchToolbarProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  placeholder?: string
  
  // Filters toggle
  onToggleFilters?: () => void
  isFilterOpen?: boolean
  activeFiltersCount?: number
  
  // Reload
  onReload?: () => void
  isLoading?: boolean
  
  // Actions
  quickActions?: React.ReactNode
}

export default function SearchToolbar({
  searchQuery,
  onSearchQueryChange,
  placeholder = 'Search records...',
  onToggleFilters,
  isFilterOpen = false,
  activeFiltersCount = 0,
  onReload,
  isLoading = false,
  quickActions,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full bg-[#0b0c10]/40 border border-white/5 p-4 rounded-xl backdrop-blur-md select-none">
      
      {/* Left: Search input field */}
      <div className="relative w-full md:max-w-md flex items-center group">
        <Search
          size={14}
          className="absolute left-3.5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors duration-150 shrink-0"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 text-xs font-sans text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200 placeholder-zinc-500"
        />
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center justify-end gap-3 w-full md:w-auto">
        
        {/* Filter Toggle Button */}
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold border rounded-lg transition-all duration-150 ${
              isFilterOpen
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>FILTERS</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-cyan-400 text-black text-[9px] font-extrabold font-mono leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        {/* Reload Trigger Button */}
        {onReload && (
          <button
            onClick={onReload}
            disabled={isLoading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-950/60 border border-white/5 hover:border-white/10 rounded-lg disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:border-white/5 transition-all duration-150"
            title="Reload Data"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-cyan-400" size={14} />
            ) : (
              <RotateCw size={14} />
            )}
          </button>
        )}

        {/* Divider */}
        {quickActions && (onToggleFilters || onReload) && (
          <div className="h-5 w-px bg-white/5 hidden md:block shrink-0" />
        )}

        {/* Quick Action Slot */}
        {quickActions && (
          <div className="flex items-center gap-2 shrink-0">
            {quickActions}
          </div>
        )}
      </div>
    </div>
  )
}
