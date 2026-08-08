import { RecommendationItem, ProductionReadiness, RecommendationCategory } from '../../types/report';
import { ParsedPayload } from './parser';
import { computeRefactorEconomics } from './calculators';

function determineCategory(severity: string, isBlocker: boolean): RecommendationCategory {
  if (isBlocker || severity === 'CRITICAL') return 'Immediate';
  if (severity === 'HIGH') return 'Today';
  if (severity === 'MEDIUM') return 'This Week';
  if (severity === 'LOW') return 'This Sprint';
  return 'Long Term';
}

function determineETA(category: RecommendationCategory): string {
  switch (category) {
    case 'Immediate': return '30 min';
    case 'Today': return '2 hours';
    case 'This Week': return '1 day';
    case 'This Sprint': return '1 sprint';
    case 'Long Term': return 'Unknown';
    default: return '1 day';
  }
}

export function buildRecommendations(
  parsed: ParsedPayload,
  productionReadiness: ProductionReadiness,
  securityFindings: any[],
  architectureData: any
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  let idCounter = 1;

  // 1. Blocking issues
  const blockingIssues = parsed.verdictData.blocking_issues || [];
  blockingIssues.forEach(issue => {
    recommendations.push({
      id: `rec-${idCounter++}`,
      category: 'Immediate',
      recommendation: issue,
      impact: 'HIGH',
      difficulty: 'MEDIUM',
      eta: determineETA('Immediate'),
      roi: 'High — prevents production outage',
      files: [],
      evidence: 'Identified as a critical blocker in chief evaluation.',
      aiReasoning: 'Must be resolved to unblock production deployment.',
      crossNavigationTarget: 'executive',
      generatedBy: 'YOWON Prime',
      intelligenceSources: ['Semantic Engine'],
      confidence: 95,
      linkedRiskId: '',
      economicImpact: computeRefactorEconomics(2)
    });
  });

  // 2. Security findings
  securityFindings.forEach((finding, i) => {
    const cat = determineCategory(finding.severity, false);
    recommendations.push({
      id: `rec-${idCounter++}`,
      category: cat,
      recommendation: finding.suggestedFix || `Resolve ${finding.severity} security issue: ${finding.description}`,
      impact: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      difficulty: 'MEDIUM',
      eta: determineETA(cat),
      roi: 'High — mitigates security risk',
      files: finding.file ? [finding.file] : [],
      evidence: finding.evidence || 'Security rule violation detected.',
      aiReasoning: finding.why || 'Standard security best practices require this fix.',
      crossNavigationTarget: 'security',
      generatedBy: 'Sentinel',
      intelligenceSources: ['Security Scanner'],
      confidence: finding.confidence || 90,
      dependsOn: i > 0 ? [`rec-${idCounter - 2}`] : undefined,
      linkedRiskId: '',
      economicImpact: computeRefactorEconomics(1)
    });
  });

  // 3. Recommended fixes (general)
  const generalFixes = parsed.verdictData.recommended_fixes || [];
  generalFixes.forEach(fix => {
    recommendations.push({
      id: `rec-${idCounter++}`,
      category: 'This Week',
      recommendation: fix,
      impact: 'MEDIUM',
      difficulty: 'LOW',
      eta: determineETA('This Week'),
      roi: 'Medium — reduces tech debt',
      files: [],
      evidence: 'General best practice recommendation.',
      aiReasoning: 'Improves maintainability and aligns with framework conventions.',
      crossNavigationTarget: 'architecture',
      generatedBy: 'Forge',
      intelligenceSources: ['AST Parser'],
      confidence: 80,
      linkedRiskId: '',
      economicImpact: computeRefactorEconomics(1)
    });
  });

  // 4. Fallback domain-specific engine
  if (recommendations.length < 3) {
    const missingEvidence = parsed.verdictData.missing_evidence || [];
    const hasTests = !missingEvidence.includes('No testing evidence');
    const hasCICD = !missingEvidence.includes('No deployment evidence');
    const sentinelScore = parsed.agentScores.sentinel ?? 70;
    const forgeScore = parsed.agentScores.forge ?? 70;
    const loc = parsed.verdictData.repository_statistics?.lines_of_code ?? 1500;
    const filesCount = parsed.verdictData.repository_statistics?.file_count ?? 45;
    const techs = parsed.verdictData.detected_technologies || [];
    const hasAI = techs.some(t => t.toLowerCase().includes('llm') || t.toLowerCase().includes('openai') || t.toLowerCase().includes('langchain'));
    
    const existingRecs = new Set(recommendations.map(r => r.recommendation));
    
    const addFallback = (rec: Partial<RecommendationItem>) => {
      if (!existingRecs.has(rec.recommendation!)) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          linkedRiskId: '',
          category: 'This Week',
          impact: 'MEDIUM',
          difficulty: 'MEDIUM',
          eta: '1 day',
          roi: 'Medium',
          files: [],
          evidence: 'Inferred from metrics',
          aiReasoning: 'Improves system health.',
          crossNavigationTarget: 'overview',
          generatedBy: 'Prime',
          intelligenceSources: ['System'],
          confidence: 85,
          ...rec
        } as RecommendationItem);
        existingRecs.add(rec.recommendation!);
      }
    };

    if (!hasTests) {
      addFallback({
        category: 'Immediate',
        recommendation: "Establish automated test baseline targeting critical service paths",
        generatedBy: 'Guardian',
        files: ['tests/', 'backend/'],
        aiReasoning: "Missing test evidence indicates a high risk for regressions. Implementing foundational tests ensures stability during iterations.",
        confidence: 90,
        roi: 'High - prevents regression bugs',
        economicImpact: {hours:16, costUsd:1200, engineers:1, sprints:1, reasoning:"Basic test setup."}
      });
    }

    if (sentinelScore < 75) {
      addFallback({
        category: 'Immediate',
        recommendation: "Enable static security scanning (Bandit/Semgrep) and pin all dependency versions",
        generatedBy: 'Sentinel',
        files: ['requirements.txt', 'package.json'],
        aiReasoning: "Low security score detected. Pinning dependencies prevents supply chain attacks and unexpected breakages.",
        confidence: 92,
        roi: 'High - stops supply chain attacks',
        economicImpact: {hours:4, costUsd:300, engineers:1, sprints:1, reasoning:"Dependency audit."}
      });
    }

    if (forgeScore < 80 && loc > 2000) {
      addFallback({
        category: 'Today',
        recommendation: "Decompose oversized service modules — target maximum 300 LOC per service boundary",
        generatedBy: 'Forge',
        files: ['backend/service.py', 'backend/api.py'],
        aiReasoning: "Large files reduce maintainability. Breaking them down improves readability and separation of concerns.",
        confidence: 88,
        roi: 'Medium - improves developer velocity',
        economicImpact: {hours:12, costUsd:900, engineers:1, sprints:1, reasoning:"Refactor large modules."}
      });
    }

    if (!hasCICD) {
      addFallback({
        category: 'Today',
        recommendation: "Introduce CI/CD pipeline with automated lint, test, and build gates on every pull request",
        generatedBy: 'Guardian',
        files: ['.github/workflows/'],
        aiReasoning: "Manual deployments are error-prone. Automation guarantees consistent quality checks.",
        confidence: 89,
        roi: 'High - accelerates release cycle',
        economicImpact: {hours:8, costUsd:600, engineers:1, sprints:1, reasoning:"CI pipeline setup."}
      });
    }
    
    if (loc > 3000) {
      addFallback({
        category: 'This Week',
        recommendation: "Add interface abstraction layer between business logic and data access — reduces coupling",
        generatedBy: 'Forge',
        files: ['backend/'],
        aiReasoning: "Tight coupling limits flexibility. Abstractions allow swapping data layers without rewriting business logic.",
        confidence: 85,
        roi: 'Medium - Future proofs architecture',
        economicImpact: {hours:20, costUsd:1500, engineers:2, sprints:1, reasoning:"Abstraction implementation."}
      });
    }

    addFallback({
      category: 'This Week',
      recommendation: "Expand integration test coverage for API boundary contracts",
      generatedBy: 'Guardian',
      files: ['tests/integration/'],
      aiReasoning: "Unit tests are insufficient for API contracts. Integration tests ensure external clients are not broken.",
      confidence: 82,
      roi: 'High - ensures API stability',
      economicImpact: {hours:24, costUsd:1800, engineers:1, sprints:1, reasoning:"Integration test expansion."}
    });

    addFallback({
      category: 'This Sprint',
      recommendation: "Add structured logging with correlation IDs and request tracing",
      generatedBy: 'Guardian',
      files: ['backend/main.py', 'backend/middleware/'],
      aiReasoning: "Debugging distributed issues requires structured logs. Correlation IDs trace requests across boundaries.",
      confidence: 86,
      roi: 'Medium - drastically speeds up debugging',
      economicImpact: {hours:6, costUsd:450, engineers:1, sprints:1, reasoning:"Logging setup."}
    });

    addFallback({
      category: 'This Sprint',
      recommendation: "Document all public API endpoints with OpenAPI examples and usage patterns",
      generatedBy: 'Showcase',
      files: ['docs/', 'README.md'],
      aiReasoning: "Undocumented APIs hinder adoption. OpenAPI specs serve as both documentation and contract testing.",
      confidence: 84,
      roi: 'Medium - enhances developer experience',
      economicImpact: {hours:8, costUsd:600, engineers:1, sprints:1, reasoning:"API documentation."}
    });
    
    addFallback({
      category: 'Long Term',
      recommendation: "Introduce event-driven architecture for decoupling high-frequency operations",
      generatedBy: 'Visionary',
      files: ['backend/'],
      aiReasoning: "Synchronous calls can bottleneck high traffic. Event buses allow asynchronous processing and better scaling.",
      confidence: 80,
      roi: 'Medium - prepares for massive scale',
      economicImpact: {hours:40, costUsd:3000, engineers:2, sprints:1, reasoning:"Architecture shift."}
    });

    if (hasAI) {
      addFallback({
        category: 'Long Term',
        recommendation: "Add AI observability tooling (LangSmith/Arize) to monitor model performance and drift",
        generatedBy: 'Visionary',
        files: ['backend/ai/', 'backend/chains/'],
        aiReasoning: "AI models degrade over time. Observability ensures prompt quality and tracks inference costs.",
        confidence: 90,
        roi: 'High - ensures AI reliability',
        economicImpact: {hours:16, costUsd:1200, engineers:1, sprints:1, reasoning:"LLM monitoring setup."}
      });
    }
  }

  return recommendations;
}
