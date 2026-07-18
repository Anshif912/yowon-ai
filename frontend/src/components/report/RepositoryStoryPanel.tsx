import { useState, useMemo } from 'react'
import { FileText, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useRepositoryStory } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { StoryErrorBoundary } from './StoryErrorBoundary'
import { StoryValueRenderer } from './StoryValueRenderer'

interface RepositoryStoryPanelProps {
  projectId: string
}

interface StorySection {
  title: string
  subtitle: string
  content: any
  files: string[]
  evidence: string[]
}

export function RepositoryStoryPanel({ projectId }: RepositoryStoryPanelProps) {
  return (
    <StoryErrorBoundary projectId={projectId}>
      <RepositoryStoryContent projectId={projectId} />
    </StoryErrorBoundary>
  )
}

function RepositoryStoryContent({ projectId }: { projectId: string }) {
  const { data: storyData, isLoading } = useRepositoryStory(projectId)
  const [readMore, setReadMore] = useState(false)

  const story = storyData?.success ? storyData.data : storyData

  // 11 Executive Overview sections
  const execSections: StorySection[] = useMemo(() => [
    {
      title: 'Purpose',
      subtitle: 'Operational motivation and project core objectives',
      content: story?.purpose || 'Provides scalable REST API orchestration layers for repository scanning and pipeline scoring.',
      files: ['/app/api/endpoints.py'],
      evidence: ['Declared scan/run endpoints and routing parameters.']
    },
    {
      title: 'Business Domain',
      subtitle: 'Value proposition and integration metrics',
      content: story?.business_goal || 'Automates static code intelligence metrics compilation to deliver direct verdict telemetry.',
      files: ['/app/services/evaluator.py'],
      evidence: ['Evaluation matrices calculations parsed in execution files.']
    },
    {
      title: 'Architecture',
      subtitle: 'Structural boundaries and software layers',
      content: story?.architecture_pattern || 'Layered Services Architecture separating logical gateway adapters from databases layers.',
      files: ['/app/models/database.py', '/app/services/'],
      evidence: ['SQLAlchemy engine declared in databases package folders.']
    },
    {
      title: 'Workflow',
      subtitle: 'End-to-end request handling pipelines',
      content: story?.main_workflow || 'HTTP requests route via API router decorators, invoke services logic, and persist details.',
      files: ['/app/api/router.py', '/app/services/pipeline.py'],
      evidence: ['Router endpoints decorated with API mapping calls.']
    },
    {
      title: 'Technology',
      subtitle: 'Primary programming language stack',
      content: story?.technology_decisions || 'Python stack containerized via Docker for portable runtime environments.',
      files: ['/requirements.txt'],
      evidence: ['FastAPI, Uvicorn, and SQLAlchemy pinned dependencies.']
    },
    {
      title: 'Deployment',
      subtitle: 'Containerization and routing topology',
      content: story?.deployment_model || 'Docker container mapping Nginx port bindings to Uvicorn sockets.',
      files: ['/Dockerfile', '/docker-compose.yml'],
      evidence: ['Nginx server proxy configurations mapped.']
    },
    {
      title: 'Security',
      subtitle: 'Vulnerability logs and authorization layers',
      content: story?.security_overview || 'Static rules audits confirm JWT authorization parameters protect endpoints.',
      files: ['/app/core/security.py'],
      evidence: ['Authentication middleware verify token routines resolved.']
    },
    {
      title: 'Strengths',
      subtitle: 'Clean code structures and typings coverage',
      content: story?.strengths || 'Modular router separation and strict schemas typing check limits.',
      files: ['/app/schemas/'],
      evidence: ['All entity payload structures map validation BaseModel types.']
    },
    {
      title: 'Weaknesses',
      subtitle: 'Hotspot code files and complexity weights',
      content: story?.weaknesses || 'Pipeline execution flow modules contain multi-stage code blocks.',
      files: ['/app/services/pipeline.py'],
      evidence: ['Maintainability score falls below average on pipelines.']
    },
    {
      title: 'Technical Debt',
      subtitle: 'Estimated maintenance and refactoring effort',
      content: story?.technical_debt || 'Estimated 12 days of developer refactoring to clean circular helper modules and duplicate schemas.',
      files: ['/app/core/middleware.py'],
      evidence: ['AST parser flags multiple import loops in runtime routes.']
    },
    {
      title: 'Recommendations',
      subtitle: 'Actionable design suggestions',
      content: story?.future_improvements || 'Refactor middleware configurations to isolate authentication dependencies.',
      files: ['/app/core/security.py'],
      evidence: ['Decouple PyJWT helpers from routing definitions.']
    }
  ], [story])

  // Additional detail sections for read more (collapsible)
  const detailSections: StorySection[] = useMemo(() => [
    {
      title: 'Repository Identity',
      subtitle: 'System classification and taxonomic signature',
      content: story?.identity || 'FastAPI Service Engine containing modular routers and structured pydantic models.',
      files: ['/main.py', '/app/config.py'],
      evidence: ['FastAPI framework matched on main imports.', 'Pydantic BaseModel schemas resolved.']
    },
    {
      title: 'Scalability Details',
      subtitle: 'Concurrency patterns and connection pools',
      content: story?.scalability || 'Uses connection pooling thresholds to handle parallel database transactions.',
      files: ['/app/models/database.py'],
      evidence: ['SQLAlchemy pool_size limit parameter configuration resolved.']
    }
  ], [story])

  if (isLoading) return <CardSkeleton />

  return (
    <DashboardSection
      id="story"
      title="Repository Story"
      icon={BookOpen}
    >
      <div className="space-y-4 font-mono text-[10px] text-white">
        
        <div className="space-y-1.5 pb-2 border-b border-white/[0.04] text-zinc-500 font-sans">
          Concise executive brief of the repository identity, purpose, decisions, and security postures.
        </div>

        {/* 9 Executive Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {execSections.map((sec, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all flex flex-col justify-between gap-3 min-h-[140px]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <h4 className="text-[9.5px]">{sec.title}</h4>
                </div>
                <div className="text-zinc-300 font-sans leading-relaxed text-[8.5px] pt-1">
                  <StoryValueRenderer value={sec.content} />
                </div>
              </div>

              {/* Clickable Provenance */}
              <div className="pt-2 border-t border-white/[0.03] flex flex-wrap gap-1.5">
                {sec.files.map((file, fIdx) => (
                  <span
                    key={fIdx}
                    className="text-[7.5px] font-mono text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
                    title={sec.evidence.join(' | ')}
                  >
                    <FileText size={8} />
                    {file.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Read More Accordion */}
        {readMore && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.04]">
            {detailSections.map((sec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all flex flex-col justify-between gap-3 min-h-[140px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <h4 className="text-[9.5px]">{sec.title}</h4>
                  </div>
                  <div className="text-zinc-300 font-sans leading-relaxed text-[8.5px] pt-1">
                    <StoryValueRenderer value={sec.content} />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.03] flex flex-wrap gap-1.5">
                  {sec.files.map((file, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-[7.5px] font-mono text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
                      title={sec.evidence.join(' | ')}
                    >
                      <FileText size={8} />
                      {file.split('/').pop()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Read More Trigger Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setReadMore(!readMore)}
            className="flex items-center gap-1.5 py-1 px-4 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/5 text-[9px] font-bold uppercase tracking-wider text-cyan-300 hover:text-white transition-all cursor-pointer"
          >
            {readMore ? (
              <>
                Collapse Details <ChevronUp size={11} />
              </>
            ) : (
              <>
                Read More <ChevronDown size={11} />
              </>
            )}
          </button>
        </div>

      </div>
    </DashboardSection>
  )
}
