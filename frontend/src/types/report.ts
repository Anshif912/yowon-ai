// All types for the hierarchical EvaluationReport DTO
// This is the SINGLE SOURCE OF TRUTH for the report workspace
// UI components must NEVER transform data — only read from this type

export type ProductionReadinessStatus = 'Ready' | 'Ready with Monitoring' | 'Internal Only' | 'Not Ready'
export type ProductionReadinessIndicator = '🟢' | '🟡' | '🟠' | '🔴'
export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'
export type RiskLikelihood = 'HIGH' | 'MEDIUM' | 'LOW'
export type RiskImpact = 'HIGH' | 'MEDIUM' | 'LOW'
export type RiskCategory = 'Security' | 'Architecture' | 'Performance' | 'Maintainability' | 'Dependency' | 'Operational'
export type RecommendationCategory = 'Immediate' | 'Today' | 'This Week' | 'This Sprint' | 'Long Term'
export type EvaluationDecision = 'APPROVE' | 'REJECT' | 'CONDITIONAL_APPROVE'
export type AgentStatusLabel = 'Thinking...' | 'Searching AST...' | 'Finished' | 'Failed'

// ── Score Explainability ─────────────────────────────────────────────────────
export interface ScoreExplainabilityFactor {
  label: string
  delta: number
  category: 'positive' | 'negative'
}
export interface ScoreExplainability {
  final: number
  baseline: number
  factors: ScoreExplainabilityFactor[]
  evidence: string[]
  confidence: number
}

// ── Threat Intelligence Feed ─────────────────────────────────────────────────
export interface ThreatFeedEvent {
  timestamp: string
  agent: string
  message: string
  severity: RiskSeverity
}

// ── Economic Estimates ───────────────────────────────────────────────────────
export interface EconomicEstimate {
  hours: number
  costUsd: number
  engineers: number
  sprints: number
  reasoning: string
}

// ── Score Weight Breakdown ───────────────────────────────────────────────────
export interface ScoreWeight {
  dimension: string
  weight: number
  rawScore: number
  weightedScore: number
}

// ── Production Readiness Checklist ───────────────────────────────────────────
export interface ProductionChecklistItem {
  label: string
  passed: boolean
  reason?: string
}

// ── Agent Agreement ──────────────────────────────────────────────────────────
export interface AgentAgreementEntry {
  agentName: string
  score: number
  agreed: boolean
  divergenceNote?: string
}

export interface ProductionReadiness {
  status: ProductionReadinessStatus
  indicator: ProductionReadinessIndicator
  reasoning: string
  signals: {
    overallScore: number
    criticalSecurityCount: number
    hasTests: boolean
    hasCICD: boolean
    hasDeploymentConfig: boolean
    architectureMaturity: string
    repositoryHealth: number
  }
}

export interface ConfidenceBreakdown {
  overall: number
  architecture: number
  security: number
  business: number
  innovation: number
  performance: number
  reasoning: string
  evidenceSummary: {
    totalFiles: number
    totalRules: number
    totalSymbols: number
    agentsAgreed: number
    agentCount: number
  }
}

export interface IntelligenceSource {
  label: string
  available: boolean
}

export interface EvidenceExplorerEntry {
  finding: string
  evidence: string
  affectedFiles: string[]
  repositoryIntelligence: string
  triggeredRules: string[]
  agentReasoning: string
  suggestedFix: string
  expectedImprovement: string
  confidence: number
  intelligenceSources: IntelligenceSource[]
}

export interface AgentResult {
  name: string
  role: string
  score: number
  confidence: number
  duration: string
  evidenceCount: number
  findingsCount: number
  filesAnalyzed: number
  symbolsProcessed: number
  rulesTriggered: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  weight: number
  dimensionScores: Record<string, number>
  status: AgentStatusLabel
  intelligenceSources: IntelligenceSource[]
  evidence: EvidenceExplorerEntry[]
  scoreExplainability: ScoreExplainability
}

export interface RiskMatrixItem {
  id: string
  category: RiskCategory
  riskName: string
  severity: RiskSeverity
  likelihood: RiskLikelihood
  impact: RiskImpact
  recommendedFix: string
  score: number
  x: number // 1-5 likelihood
  y: number // 1-5 impact
  affectedFiles: string[]
  crossNavigationTarget: string
  evidence: EvidenceExplorerEntry
  reason: string
  linkedRecommendationId: string
}

export interface RecommendationItem {
  id: string
  category: RecommendationCategory
  recommendation: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  difficulty: 'HIGH' | 'MEDIUM' | 'LOW'
  eta: string
  roi: string
  files: string[]
  evidence: string
  aiReasoning: string
  crossNavigationTarget: string
  generatedBy: string
  intelligenceSources: string[]
  confidence: number
  dependsOn?: string[]
  linkedRiskId?: string
  linkedAgent?: string
  economicImpact?: EconomicEstimate
}

export interface SecurityFinding {
  severity: RiskSeverity
  description: string
  file: string
  evidence: string
  suggestedFix: string
  why: string
  rule: string
  confidence: number
}

export interface RepositoryDNA {
  languages: string[]
  frameworks: string[]
  architecturePattern: string
  database: string
  apiStyle: string
  deployment: string
  containerization: string
  cicd: string
  testing: string
  documentation: string
  infrastructure: string
  cloudProvider: string
  authentication: string
  aiFrameworks: string[]
  estimatedScale: string
  detectedLayers: string[]
  couplingLevel: 'Low' | 'Medium' | 'High'
  circularImports: number
  sharedServices: number
  deadModules: number
}

export interface RepositoryHealth {
  healthScore: number
  codeSmells: number
  duplications: string
  deadCode: string
  security: string
  maintainability: string
}

export interface TimelineEvent {
  stage: string
  status: 'completed' | 'running' | 'waiting' | 'failed'
  timestamp: string
  agent: string
  durationMs?: number
}

export interface HistoryEntry {
  evaluationId: string
  commit: string
  timestamp: string
  overallScore: number
  verdict: string
  engineVersion: string
  reportVersion: number
}

export interface ScoreDelta {
  overall: number
  architecture: number
  security: number
  innovation: number
  performance: number
  business: number
}

export interface EvaluationReport {
  projectId: string
  projectName: string
  projectType: string
  status: string
  overallScore: number
  verdict: string
  confidence: number
  confidenceBreakdown: ConfidenceBreakdown

  overview: {
    overallScore: number
    consensus: number
    productionReadiness: ProductionReadiness
    repositoryHealth: number
    agentStatusText: string
    scoreTrend: ScoreDelta | null
    quickActions: Array<{ label: string; route: string; icon: string }>
  }

  executive: {
    decision: EvaluationDecision
    confidence: number
    confidenceBreakdown: ConfidenceBreakdown
    riskLevel: string
    productionReadiness: ProductionReadiness
    topFindings: string[]
    topStrengths: string[]
    topWeaknesses: string[]
    deploymentAdvice: string
    estimatedEngineeringHours: number
    executiveSummary: string
    businessImpact: string
    repositoryHealth: number
    dynamicNarrative: string
    ceoSummary: string
    scoreWeights: ScoreWeight[]
    productionChecklist: ProductionChecklistItem[]
  }

  council: {
    overallScore: number
    consensus: number
    dataQuality: string
    agents: AgentResult[]
    dynamicNarrative: string
    agentAgreement: AgentAgreementEntry[]
    divergenceExplanation: string
  }

  architecture: {
    maturity: string
    originality: string
    complexity: string
    totalClasses: number
    totalFunctions: number
    totalLoc: number
    totalFiles: number
    architectureNodes: number
    totalDependencies: number
    summary: string
    intelligenceSources: IntelligenceSource[]
    dynamicNarrative: string
  }

  repository: {
    snapshot: {
      branch: string
      commit: string
      languages: string[]
      frameworks: string[]
      sizeBytes: number
      hash: string
      uploadedBy: string
      engineVersion: string
    }
    dna: RepositoryDNA
    health: RepositoryHealth
    timeline: TimelineEvent[]
    history: HistoryEntry[]
  }

  business: {
    engineeringCost: string
    developerVelocity: string
    maintenanceCost: string
    scalingReadiness: string
    cloudReadiness: string
    operationalCost: string
    repositoryLifetime: string
    estimatedRefactorCost: string
    maintainabilityGrade: string
    maintainabilityScore: number
    technicalDebtDays: number
    kpis: {
      testCoverage: string
      maintainabilityIndex: number
      cyclomaticComplexity: string
      avgFileComplexity: string
      largestModule: string
      technicalDebtRatio: string
      documentationCoverage: string
    }
    dynamicNarrative: string
    refactorEconomics: EconomicEstimate
  }

  innovation: {
    score: number
    technologyStack: string[]
    noveltyScore: number
    architectureOriginality: string
    aiUsage: string
    modernPractices: string[]
    openSourceQuality: string
    differentiationScore: number
    competitiveComparison: string
    narrative: string
    dynamicNarrative: string
    peerComparison: {
      category: string
      peers: string[]
      innovationPercentile: number
      architecturePercentile: number
      testingPercentile: number
      summary: string
    }
  }

  security: {
    score: number
    grade: string
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    findings: SecurityFinding[]
    intelligenceSources: IntelligenceSource[]
    dynamicNarrative: string
  }

  risk: {
    overallRiskScore: number
    riskLevel: string
    riskMatrix: RiskMatrixItem[]
    intelligenceSources: IntelligenceSource[]
    dynamicNarrative: string
    threatFeed: ThreatFeedEvent[]
  }

  recommendations: {
    totalHours: number
    fixes: RecommendationItem[]
    dynamicNarrative: string
  }

  metadata: {
    sha256: string
    generatedAt: string
    engineVersion: string
    cloneTimeMs: number
    astTimeMs: number
    embeddingTimeMs: number
    agentTimeMs: number
    reportTimeMs: number
    totalDurationMs: number
    reportVersion: number
  }

  export: {
    pdfUrl: string
    jsonUrl: string
    markdownUrl: string
    csvUrl: string
    evidenceBundleUrl: string
  }

  comparison: {
    available: boolean
    compareEvaluationId: string | null
    compareCommit: string | null
    scoreDeltas: ScoreDelta | null
  }
}
