"""
innovation_engine.py
Computes the Innovation Index based on RepositoryIntelligenceResult.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from intelligence.ri_contract import RIResult

@dataclass
class InnovationIndex:
    score: float
    architecture_novelty: float
    ai_integration_depth: float
    automation_coverage: float
    modern_framework_index: float
    differentiators: List[str] = field(default_factory=list)
    baseline_comparison: str = ""
    narrative: str = ""

def compute_innovation_index(ri_result: Optional[RIResult]) -> InnovationIndex:
    """Computes the dynamic innovation metrics."""
    if not ri_result:
        return InnovationIndex(0.0, 0.0, 0.0, 0.0, 0.0, [], "No data available.", "Unable to compute innovation index due to missing data.")
        
    ai_intel = ri_result.ai_intelligence or {}
    ai_depth = 0.0
    diffs = []
    
    agent_count = ai_intel.get("agent_count", 0)
    if agent_count > 0:
        ai_depth += 40.0
        diffs.append(f"Multi-agent architecture with {agent_count} AI agents")
        
    if ai_intel.get("llm_usage", False):
        ai_depth += 30.0
        diffs.append("Direct LLM integration")
        
    if ai_intel.get("vector_db", False):
        ai_depth += 30.0
        diffs.append("Vector database utilization for semantic search/RAG")
        
    arch_nodes = ri_result.architecture_graph.get("nodes", []) if ri_result.architecture_graph else []
    node_types = {n.get("type", "unknown") for n in arch_nodes}
    arch_novelty = min(100.0, len(arch_nodes) * 5 + len(node_types) * 10)
    if len(node_types) > 3:
        diffs.append("Complex, multi-paradigm architectural topology")
        
    ci_files = sum(1 for n in ri_result.repository_tree if ".github/workflows" in n.get("path", "") or ".gitlab-ci.yml" in n.get("name", ""))
    automation = min(100.0, ci_files * 25.0)
    if automation >= 50.0:
        diffs.append("Comprehensive CI/CD pipeline automation")
        
    techs = [t.lower() for t in ri_result.detected_technologies]
    modern_count = sum(1 for fw in ["react", "next", "fastapi", "graphql", "tailwind", "svelte"] if any(fw in t for t in techs))
    framework_index = min(100.0, modern_count * 25.0)
    if modern_count > 0:
        diffs.append("Utilization of modern, high-performance frameworks")
        
    score = (ai_depth * 0.4) + (arch_novelty * 0.25) + (framework_index * 0.2) + (automation * 0.15)
    score = round(min(100.0, score), 2)
    
    if score > 80:
        baseline = "Top 10% of projects: Highly innovative with advanced capabilities."
    elif score > 60:
        baseline = "Above average: Solid integration of modern practices."
    elif score > 40:
        baseline = "Average: Standard implementation without major novelties."
    else:
        baseline = "Below average: Traditional architecture with limited innovation."
        
    narrative = f"The project scores {score}/100 on the Innovation Index. "
    narrative += f"It demonstrates {'deep' if ai_depth > 50 else 'limited'} AI integration and utilizes a {len(node_types)}-tier architecture. "
    if diffs:
        narrative += f"Key differentiators include {diffs[0].lower()}."
        
    return InnovationIndex(
        score=score,
        architecture_novelty=arch_novelty,
        ai_integration_depth=ai_depth,
        automation_coverage=automation,
        modern_framework_index=framework_index,
        differentiators=diffs,
        baseline_comparison=baseline,
        narrative=narrative
    )
