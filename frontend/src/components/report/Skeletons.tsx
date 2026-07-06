import React from 'react'

const SHIMMER_STYLE = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <div className={`relative overflow-hidden bg-white/[0.03] rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent ${className}`} />
    </>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Shimmer className="h-4 w-1/3" />
      <Shimmer className="h-8 w-2/3" />
      <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
      </div>
    </div>
  )
}

export function TreeSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <Shimmer className="h-5 w-1/4" />
        <Shimmer className="h-5 w-16" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3" style={{ paddingLeft: `${(i % 3) * 16}px` }}>
            <Shimmer className="h-4 w-4 rounded" />
            <Shimmer className="h-4 w-[120px] sm:w-[240px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function GraphSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <Shimmer className="h-5 w-1/3" />
        <div className="flex gap-2">
          <Shimmer className="h-6 w-12" />
          <Shimmer className="h-6 w-12" />
        </div>
      </div>
      <div className="h-[300px] border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden bg-black/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-dashed border-white/10 animate-spin" />
        </div>
        <div className="space-y-4 relative z-10 text-center">
          <Shimmer className="h-3 w-28 mx-auto" />
          <Shimmer className="h-2 w-44 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export function MetricsSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Shimmer className="h-5 w-1/4" />
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="bg-white/[0.02] p-3 border-b border-white/5 flex gap-4">
          <Shimmer className="h-4 w-1/3" />
          <Shimmer className="h-4 w-1/6" />
          <Shimmer className="h-4 w-1/6" />
          <Shimmer className="h-4 w-1/6" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 border-b border-white/5 flex gap-4 last:border-none">
            <Shimmer className="h-4 w-1/3" />
            <Shimmer className="h-4 w-1/6" />
            <Shimmer className="h-4 w-1/6" />
            <Shimmer className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="glass-card p-6 space-y-6">
      <Shimmer className="h-5 w-1/4" />
      <div className="relative border-l border-white/10 pl-6 space-y-6 ml-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="space-y-2">
              <Shimmer className="h-4 w-1/3" />
              <Shimmer className="h-3 w-1/6" />
              <Shimmer className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EvidenceSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-1/4" />
        <Shimmer className="h-8 w-48" />
      </div>
      <div className="border border-white/5 rounded-lg overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border-b border-white/5 flex flex-col gap-2 last:border-none">
            <div className="flex justify-between items-center">
              <Shimmer className="h-4 w-1/4" />
              <Shimmer className="h-4 w-12 rounded-full" />
            </div>
            <Shimmer className="h-3 w-5/6" />
            <Shimmer className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function RepositorySkeleton() {
  return (
    <div className="glass-card p-8 border border-amber-500/20 bg-amber-950/[0.03] space-y-6 text-center">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-spin" />
        <div className="absolute inset-2 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-500 font-mono text-xs font-bold">AI</div>
      </div>
      <div className="space-y-2 max-w-sm mx-auto">
        <h3 className="font-display font-semibold text-white">Repository Intelligence Offline</h3>
        <p className="text-xs text-yowon-muted">Static analysis is running in the background. Widgets will unlock automatically as stages complete.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
        {['Tree Structure', 'Architecture', 'Ecosystem Graphs', 'Code Metrics'].map(t => (
          <div key={t} className="border border-white/5 rounded-lg p-3 space-y-2">
            <Shimmer className="h-3 w-2/3 mx-auto" />
            <Shimmer className="h-2 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
