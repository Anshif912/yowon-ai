import React from 'react'

export interface LoadingSkeletonProps {
  variant?: 'grid' | 'table' | 'card' | 'details' | 'list'
  rows?: number
  columns?: number
  className?: string
}

export default function LoadingSkeleton({
  variant = 'grid',
  rows = 4,
  columns = 3,
  className = '',
}: LoadingSkeletonProps) {
  
  // Render grid structure
  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-4 w-full ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse relative overflow-hidden rounded-xl border border-white/5 bg-[#0b0c10]/60 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-1/3 bg-white/5 rounded-md" />
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
            </div>
            <div className="h-8 w-2/3 bg-white/5 rounded-md" />
            <div className="h-3 w-full bg-white/5 rounded-md mt-2" />
          </div>
        ))}
      </div>
    )
  }

  // Render table format skeleton
  if (variant === 'table') {
    return (
      <div className={`w-full border border-white/5 rounded-xl bg-[#0b0c10]/40 overflow-hidden animate-pulse ${className}`}>
        {/* Table Header */}
        <div className="bg-[#05070a] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3.5 bg-white/5 rounded-md" style={{ width: `${100 / columns - 10}%` }} />
          ))}
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, ri) => (
            <div key={ri} className="px-6 py-4 flex items-center justify-between">
              {Array.from({ length: columns }).map((_, ci) => (
                <div key={ci} className="h-3 bg-white/5 rounded-md" style={{ width: `${100 / columns - 15}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render detail inspector format skeleton
  if (variant === 'details') {
    return (
      <div className={`flex flex-col gap-6 w-full animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white/5 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-1/3 bg-white/5 rounded-md" />
            <div className="h-3 w-1/4 bg-white/5 rounded-md" />
          </div>
        </div>
        
        <div className="h-px bg-white/5 my-2" />
        
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3.5 w-1/4 bg-white/5 rounded-md" />
              <div className="h-8 w-full bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render list of items
  if (variant === 'list') {
    return (
      <div className={`flex flex-col gap-3 w-full animate-pulse ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#0b0c10]/40 gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3.5 w-1/3 bg-white/5 rounded-md" />
                <div className="h-3 w-1/2 bg-white/5 rounded-md" />
              </div>
            </div>
            <div className="h-6 w-16 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  // Default: Single Card Skeleton
  return (
    <div className={`animate-pulse overflow-hidden rounded-xl border border-white/5 bg-[#0b0c10]/60 p-6 flex flex-col gap-4 ${className}`}>
      <div className="h-4 w-1/4 bg-white/5 rounded-md" />
      <div className="h-10 w-1/2 bg-white/5 rounded-md" />
      <div className="h-3 w-3/4 bg-white/5 rounded-md" />
    </div>
  )
}
