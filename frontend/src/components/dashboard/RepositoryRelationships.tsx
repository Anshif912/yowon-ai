interface RelationshipNode {
  name: string
  repositoriesCount: number
  frameworks: string[]
  couplingLevel: string
}

interface RepositoryRelationshipsProps {
  layers?: RelationshipNode[]
  onLayerClick?: (layerName: string) => void
}

export default function RepositoryRelationships({
  layers = [
    { name: 'Application Layer', repositoriesCount: 5, frameworks: ['React', 'Next.js'], couplingLevel: 'Low' },
    { name: 'API Layer', repositoriesCount: 4, frameworks: ['FastAPI', 'REST'], couplingLevel: 'Medium' },
    { name: 'Business Services', repositoriesCount: 6, frameworks: ['Service Layers', 'Pydantic'], couplingLevel: 'Low' },
    { name: 'AI Retrieval / Agents', repositoriesCount: 3, frameworks: ['LangChain', 'CrewAI'], couplingLevel: 'High' },
    { name: 'Persistence / Storage', repositoriesCount: 4, frameworks: ['PostgreSQL', 'SQLite'], couplingLevel: 'Low' },
  ],
  onLayerClick,
}: RepositoryRelationshipsProps) {
  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Repository DNA Relationships
        </h3>
        <p className="text-[9.5px] text-zinc-500 font-sans leading-relaxed">
          Architectural layer mapping automatically compiled from repository static AST files.
        </p>
      </div>

      <div className="flex flex-col gap-2 relative">
        {layers.map((layer, idx) => {
          return (
            <div
              key={layer.name}
              onClick={() => onLayerClick?.(layer.name)}
              className="group bg-[#0c0d12] border border-white/[0.04] hover:border-cyan-400/20 hover:bg-white/[0.02] p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-cyan-400 font-mono w-6 text-right">
                  0{idx + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors font-display">
                    {layer.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.frameworks.map((f) => (
                      <span
                        key={f}
                        className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-800 text-zinc-400 font-mono"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] space-y-0.5">
                <div className="text-zinc-400 font-bold font-mono">
                  {layer.repositoriesCount} Repos
                </div>
                <div className="text-[8px] text-zinc-500 uppercase">
                  Coupling: <span className="text-cyan-400 font-bold">{layer.couplingLevel}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
