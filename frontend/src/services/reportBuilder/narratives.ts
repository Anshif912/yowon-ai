import { AgentResult, RecommendationItem, RepositoryDNA, EconomicEstimate } from '../../types/report';
import { ParsedPayload } from './parser';

export function generateExecutiveNarrative(report: any, parsed: ParsedPayload): string {
  const score = report.overallScore ?? 0;
  const decision = report.executive?.decision || 'REJECT';
  const reason = decision === 'APPROVE' ? 'strong architectural foundation' : 'significant technical debt';
  const frameworks = (parsed.verdictData.detected_technologies || []).join(', ') || 'standard libraries';
  const topRisk = report.executive?.topFindings?.[0] || 'Unknown risk';
  const hours = report.executive?.estimatedEngineeringHours ?? 0;
  
  return `The repository achieved an overall evaluation score of ${score}/100, resulting in a decision to ${decision} based on ${reason}. Utilizing a stack involving ${frameworks}, the project requires an estimated ${hours} engineering hours to address primary concerns. The most critical risk identified is: ${topRisk}.`;
}

export function generateCouncilNarrative(agents: AgentResult[]): string {
  const count = agents.length;
  if (count === 0) return 'No agents were available for analysis.';
  
  const sorted = [...agents].sort((a, b) => b.score - a.score);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  
  const avgScore = agents.reduce((acc, a) => acc + a.score, 0) / count;
  const divergent = agents.filter(a => Math.abs(a.score - avgScore) > 15);
  const disagreementText = divergent.length > 0 
    ? `Notable disagreements arose, particularly from ${divergent.map(d => d.name).join(', ')} regarding domain-specific constraints.` 
    : `The agents reached a strong consensus with minimal divergence.`;
    
  return `The AI council, comprised of ${count} specialized analytical agents, completed their evaluation. ${highest.name} awarded the highest score of ${highest.score}, citing strong domain findings, while ${lowest.name} scored the lowest at ${lowest.score}. ${disagreementText}`;
}

export function generateArchitectureNarrative(arch: any, dna: RepositoryDNA): string {
  const frameworks = dna.frameworks.length ? dna.frameworks.join(', ') : 'no specific frameworks';
  const loc = arch.totalLoc ?? 0;
  const layers = dna.detectedLayers.length ? dna.detectedLayers.join(' and ') : 'unclear layer separation';
  return `The architecture spans ${loc} lines of code, heavily utilizing ${frameworks}. Structural analysis detected ${layers}. With a coupling level identified as ${dna.couplingLevel}, and approximately ${dna.circularImports} circular imports, the modularity requires targeted refinement to sustain long-term growth.`;
}

export function generateSecurityNarrative(security: any): string {
  const total = (security.criticalCount ?? 0) + (security.highCount ?? 0) + (security.mediumCount ?? 0) + (security.lowCount ?? 0);
  const findings = security.findings || [];
  const hasAuth = findings.some((f: any) => f.description.toLowerCase().includes('auth'));
  const authText = hasAuth ? 'Issues with authentication mechanisms were noted.' : 'Authentication paths appeared relatively secure or were absent.';
  
  return `Security scanning resulted in a grade of ${security.grade || 'Unknown'}, uncovering ${total} total findings (${security.criticalCount ?? 0} critical, ${security.highCount ?? 0} high). ${authText} It is crucial to address these vulnerabilities, implement proper dependency pinning, and ensure strict Content Security Policies (CSP) are enforced where applicable.`;
}

export function generateRiskNarrative(risk: any): string {
  const riskMatrix = risk.riskMatrix || [];
  const topCategories = [...new Set(riskMatrix.map((r: any) => r.category))].slice(0, 2);
  const catsText = topCategories.length ? topCategories.join(' and ') : 'various structural';
  
  return `Operating at a ${risk.riskLevel} risk level, the overall risk score is calculated at ${risk.overallRiskScore}/100. Primary threats originate from the ${catsText} domains. Immediate mitigation strategies must be employed to stabilize the operational baseline and prevent compounding architectural decay.`;
}

export function generateBusinessNarrative(business: any, economics: EconomicEstimate): string {
  const days = business.technicalDebtDays ?? 0;
  return `From a business perspective, the repository earned a maintainability grade of ${business.maintainabilityGrade || 'C'}. It carries an estimated ${days} technical debt days. Remediation is projected to cost $${economics.costUsd}, requiring ${economics.sprints} sprints of focused engineering effort to properly align with enterprise standards.`;
}

export function generateInnovationNarrative(innovation: any, dna: RepositoryDNA): string {
  const ai = dna.aiFrameworks.length ? dna.aiFrameworks.join(', ') : 'None detected';
  const percentile = innovation.peerComparison?.innovationPercentile ?? 50;
  
  return `With an innovation score reflecting the integration of AI tools (${ai}), the repository ranks in the ${percentile}th percentile against industry peers. Compared to standard static analysis tools like SonarQube, or security scanners like GitHub Advanced Security, this platform leverages modern AI-driven insights to maintain a competitive edge.`;
}

export function generateRecommendationNarrative(fixes: RecommendationItem[]): string {
  const total = fixes.length;
  const immediate = fixes.filter(f => f.category === 'Immediate').length;
  const hours = fixes.reduce((acc, f) => acc + (f.economicImpact?.hours ?? 0), 0);
  const topRec = fixes.length > 0 ? fixes[0].recommendation : 'None';
  
  return `The engine formulated ${total} actionable recommendations, including ${immediate} immediate priorities. Executing these fixes will require an estimated ${hours} engineering hours. The highest priority directive is: "${topRec}". Addressing this first will yield the highest return on investment.`;
}
