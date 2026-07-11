export interface RKMEntity {
  id: string
  label: string
  type: 'repository' | 'subsystem' | 'capability' | 'service' | 'api' | 'controller' | 'worker' | 'agent' | 'llm' | 'prompt' | 'memory' | 'retriever' | 'database' | 'cache' | 'queue' | 'event' | 'config' | 'deployment' | 'integration' | 'technology' | 'evidence' | 'recommendation' | 'package' | 'class' | 'function' | 'module'
  purpose: string
  health: number
  complexity: number
  confidence: number // percentage, e.g. 95 for 95%
  evidence: string[] // Scanned file/decorator evidence paths
  technologies: string[]
  dependencies: string[]
  files: string[]
  metadata?: any
}

export interface RKMRelationship {
  source: string
  target: string
  type: 'CALLS' | 'USES' | 'IMPLEMENTS' | 'DEPENDS_ON' | 'READS' | 'WRITES' | 'EMITS' | 'LISTENS' | 'SPAWNS' | 'LOADS' | 'CONFIGURES' | 'DEPLOYS'
  label?: string
}

export interface RKMModel {
  metadata: {
    projectId: string
    name: string
    projectType: string
    riskLevel: string
    overallScore: number
    confidence: number
  }
  entities: Record<string, RKMEntity>
  relationships: RKMRelationship[]
}
