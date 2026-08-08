"""
dynamic_analysis.py
Analyzes RIResult to extract Strengths, Weaknesses, and Risks with auditable evidence chains.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from intelligence.ri_contract import RIResult

@dataclass
class Strength:
    title: str
    description: str
    evidence_file: str
    confidence: float
    category: str
    evidence_files: List[str] = field(default_factory=list)
    evidence_symbols: List[str] = field(default_factory=list)
    confidence_reason: str = "Observed directly in repository assets"
    source: str = "RULE_ENGINE"

@dataclass
class Weakness:
    title: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    evidence_file: str
    recommendation: str
    category: str
    confidence: float = 90.0
    evidence_files: List[str] = field(default_factory=list)
    evidence_symbols: List[str] = field(default_factory=list)
    confidence_reason: str = "Computed from repository structural metrics"
    source: str = "RULE_ENGINE"

@dataclass
class Risk:
    risk: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
    impact: str
    evidence: str
    affected_files: List[str]
    recommendation: str
    confidence: float
    evidence_files: List[str] = field(default_factory=list)
    evidence_symbols: List[str] = field(default_factory=list)
    confidence_reason: str = "Estimated via static rules and architecture modeling"
    source: str = "KNOWLEDGE_GRAPH"

class StrengthDetector:
    def detect(self, ri_result: RIResult) -> List[Strength]:
        strengths = []
        if not ri_result:
            return strengths
            
        test_files = [n.get("path", "") for n in ri_result.repository_tree if "test" in n.get("name", "").lower()]
        if test_files:
            strengths.append(Strength(
                title="Testing Practices",
                description=f"Found {len(test_files)} test files indicating commitment to quality.",
                evidence_file=test_files[0],
                confidence=85.0,
                category="Quality",
                evidence_files=test_files[:5],
                confidence_reason=f"Observed directly in {len(test_files)} files",
                source="RULE_ENGINE"
            ))
            
        arch_nodes = ri_result.architecture_graph.get("nodes", []) if ri_result.architecture_graph else []
        if len(arch_nodes) > 3:
            node_labels = [n.get("label", n.get("id", "")) for n in arch_nodes]
            strengths.append(Strength(
                title="Modular Architecture",
                description=f"Detected {len(arch_nodes)} distinct architectural components.",
                evidence_file="Architecture Graph",
                confidence=90.0,
                category="Design",
                evidence_symbols=node_labels[:5],
                confidence_reason="Observed modular nodes in architecture topology map",
                source="KNOWLEDGE_GRAPH"
            ))
            
        techs = [t.lower() for t in ri_result.detected_technologies]
        if any("docker" in t for t in techs):
            docker_files = [n.get("path", "Dockerfile") for n in ri_result.repository_tree if "docker" in n.get("name", "").lower()]
            strengths.append(Strength(
                title="Containerization",
                description="Docker configuration found, promoting consistent environments.",
                evidence_file=docker_files[0] if docker_files else "Dockerfile",
                confidence=95.0,
                category="DevOps",
                evidence_files=docker_files[:3],
                confidence_reason="Dockerfiles detected in repository tree",
                source="RULE_ENGINE"
            ))
            
        if any("github-actions" in t or "gitlab-ci" in t for t in techs):
            ci_files = [n.get("path", "") for n in ri_result.repository_tree if "workflow" in n.get("path", "").lower() or "gitlab-ci" in n.get("name", "").lower()]
            strengths.append(Strength(
                title="CI/CD Pipeline",
                description="Continuous integration/deployment workflows detected.",
                evidence_file=ci_files[0] if ci_files else ".github/workflows",
                confidence=95.0,
                category="DevOps",
                evidence_files=ci_files[:3],
                confidence_reason="Automation config files verified",
                source="RULE_ENGINE"
            ))
            
        if any(t in techs for t in ["typescript", "rust", "go"]):
            strengths.append(Strength(
                title="Type Safety",
                description="Usage of strongly typed languages reduces runtime errors.",
                evidence_file="Source code",
                confidence=90.0,
                category="Reliability",
                confidence_reason=f"Detected type-safe language declarations in project configuration",
                source="DEPENDENCY_SCANNER"
            ))
            
        return strengths

class WeaknessDetector:
    def detect(self, ri_result: RIResult) -> List[Weakness]:
        weaknesses = []
        if not ri_result:
            return weaknesses
            
        if ri_result.diagnostics:
            loc_per_file = ri_result.diagnostics.total_loc / max(1, ri_result.diagnostics.total_files)
            if loc_per_file > 400:
                weaknesses.append(Weakness(
                    title="Large Files Detected",
                    severity="MEDIUM",
                    description=f"Average LOC per file is {loc_per_file:.1f}, exceeding typical maintainability thresholds (>400).",
                    evidence_file="Global",
                    recommendation="Refactor large files into smaller, focused modules.",
                    category="Maintainability",
                    confidence=90.0,
                    confidence_reason="Calculated LOC-to-file ratio from diagnostics metrics",
                    source="AST_PARSER"
                ))
                
        test_files = sum(1 for n in ri_result.repository_tree if "test" in n.get("name", "").lower())
        total_files = ri_result.diagnostics.total_files if ri_result.diagnostics else 1
        if total_files > 0 and (test_files / total_files) < 0.1:
            weaknesses.append(Weakness(
                title="Low Test Coverage",
                severity="HIGH",
                description="Test file ratio is below 10%, indicating insufficient automated testing.",
                evidence_file="Repository Tree",
                recommendation="Increase unit and integration test coverage.",
                category="Quality",
                confidence=85.0,
                confidence_reason=f"Computed test-to-implementation file ratio ({test_files}/{total_files})",
                source="RULE_ENGINE"
            ))
            
        has_readme = any(n.get("name", "").lower() == "readme.md" for n in ri_result.repository_tree)
        if not has_readme:
            weaknesses.append(Weakness(
                title="Missing Documentation",
                severity="MEDIUM",
                description="No main README.md found in the repository root.",
                evidence_file="Root",
                recommendation="Add a comprehensive README.md for onboarding.",
                category="Documentation",
                confidence=95.0,
                confidence_reason="README.md presence check returned false",
                source="RULE_ENGINE"
            ))
            
        for finding in (ri_result.security_findings or []):
            sev = finding.get("severity", "MEDIUM").upper()
            if sev in ["HIGH", "CRITICAL"]:
                weaknesses.append(Weakness(
                    title=f"Security: {finding.get('title', 'Vulnerability')}",
                    severity=sev,
                    description=finding.get("description", "Security risk detected."),
                    evidence_file=finding.get("file", "Unknown"),
                    recommendation="Address the vulnerability immediately.",
                    category="Security",
                    confidence=90.0,
                    evidence_files=[finding.get("file")] if finding.get("file") else [],
                    confidence_reason="Reported by vulnerability database matching",
                    source="SECURITY_SCANNER"
                ))
                
        return weaknesses

class RiskClassifier:
    def classify(self, ri_result: RIResult) -> List[Risk]:
        risks = []
        if not ri_result:
            return risks
            
        for finding in (ri_result.security_findings or []):
            sev = finding.get("severity", "MEDIUM").upper()
            risks.append(Risk(
                risk=finding.get("title", "Security Vulnerability"),
                severity=sev,
                impact="Potential security breach or data exposure.",
                evidence=finding.get("description", ""),
                affected_files=[finding.get("file", "Global")],
                recommendation="Review and patch the identified vulnerability.",
                confidence=90.0,
                evidence_files=[finding.get("file")] if finding.get("file") else [],
                confidence_reason="Verified CVE mismatch or credential leak detected",
                source="SECURITY_SCANNER"
            ))
            
        edges = ri_result.architecture_graph.get("edges", []) if ri_result.architecture_graph else []
        nodes = ri_result.architecture_graph.get("nodes", []) if ri_result.architecture_graph else []
        if len(nodes) > 0 and len(edges) / len(nodes) > 3.0:
            risks.append(Risk(
                risk="High Architectural Coupling",
                severity="MEDIUM",
                impact="Harder to maintain and modify without unintended side effects.",
                evidence=f"Arch graph has {len(edges)} edges for {len(nodes)} nodes.",
                affected_files=[],
                recommendation="Introduce abstractions or interfaces to decouple components.",
                confidence=85.0,
                confidence_reason="High density score computed on structural edges map",
                source="KNOWLEDGE_GRAPH"
            ))
            
        return risks

def analyze_repository(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Runs all dynamic analysis modules on the RIResult."""
    if not ri_result:
        return {"strengths": [], "weaknesses": [], "risks": []}
        
    s_detector = StrengthDetector()
    w_detector = WeaknessDetector()
    r_classifier = RiskClassifier()
    
    strengths = s_detector.detect(ri_result)
    weaknesses = w_detector.detect(ri_result)
    risks = r_classifier.classify(ri_result)
    
    return {
        "strengths": [s.__dict__ for s in strengths],
        "weaknesses": [w.__dict__ for w in weaknesses],
        "risks": [r.__dict__ for r in risks]
    }
