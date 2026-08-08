"""
business_engine.py
Evaluates Business Valuation, Technical Debt, and Readiness from RIResult.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from intelligence.ri_contract import RIResult
from scoring.dynamic_analysis import WeaknessDetector

@dataclass
class BusinessValuation:
    technical_debt_days: float
    maintenance_effort: str
    production_readiness: str
    cloud_readiness: str
    deployment_maturity: str
    maintainability_grade: str
    maintainability_score: float
    business_impact: str
    operational_complexity: str
    refactoring_effort_days: float
    key_insights: List[str] = field(default_factory=list)

def compute_business_value(ri_result: Optional[RIResult], council_verdict: Optional[Dict] = None) -> BusinessValuation:
    """Computes the business value metrics."""
    if not ri_result:
        return BusinessValuation(0.0, "UNKNOWN", "NOT_READY", "UNKNOWN", "UNKNOWN", "F", 0.0, "UNKNOWN", "UNKNOWN", 0.0, ["No data"])
        
    insights = []
    debt = 0.0
    diag = ri_result.diagnostics
    loc_per_file = 0.0
    
    if diag:
        untested_loc = diag.total_loc * 0.8
        debt += (untested_loc / 100) * 1.0
        loc_per_file = diag.total_loc / max(1, diag.total_files)
        if loc_per_file > 400:
            debt += 2.0 * (diag.total_files * 0.1)
            
    weaknesses = WeaknessDetector().detect(ri_result)
    for w in weaknesses:
        if w.severity == "HIGH":
            debt += 3.0
            
    for f in (ri_result.security_findings or []):
        debt += 5.0
        
    debt = min(120.0, debt)
    
    m_score = 100.0
    if diag and loc_per_file > 400:
        m_score -= 5.0
        
    has_readme = any(n.get("name", "").lower() == "readme.md" for n in ri_result.repository_tree)
    if not has_readme:
        m_score -= 10.0
        
    critical_sec = sum(1 for f in (ri_result.security_findings or []) if f.get("severity", "").upper() == "CRITICAL")
    m_score -= (critical_sec * 15.0)
    
    test_files = sum(1 for n in ri_result.repository_tree if "test" in n.get("name", "").lower())
    total_files = diag.total_files if diag else 1
    if total_files > 0 and (test_files / total_files) < 0.1:
        m_score -= 10.0
        
    techs = [t.lower() for t in ri_result.detected_technologies]
    if any("github-actions" in t for t in techs):
        m_score += 10.0
    if any("docker" in t for t in techs):
        m_score += 5.0
        
    m_score = max(0.0, min(100.0, m_score))
    
    if m_score >= 90: grade = "A"
    elif m_score >= 75: grade = "B"
    elif m_score >= 60: grade = "C"
    elif m_score >= 45: grade = "D"
    else: grade = "F"
    
    has_docker = any("docker" in t for t in techs)
    sec_score = 100 - (critical_sec * 20)
    if has_docker and (test_files / total_files > 0.1) and sec_score > 70:
        prod_ready = "READY"
    elif has_docker or (test_files / total_files > 0.05):
        prod_ready = "NEAR_READY"
    elif sec_score < 40:
        prod_ready = "DEFERRED"
    else:
        prod_ready = "NOT_READY"
        
    insights.append(f"Technical debt estimated at {debt:.1f} days.")
    insights.append(f"Maintainability score is {m_score:.1f}/100 (Grade {grade}).")
    insights.append(f"Production readiness is assessed as {prod_ready}.")
    if has_docker:
        insights.append("Docker containerization present, improving cloud readiness.")
        
    return BusinessValuation(
        technical_debt_days=round(debt, 1),
        maintenance_effort="LOW" if debt < 14 else "HIGH",
        production_readiness=prod_ready,
        cloud_readiness="HIGH" if has_docker else "LOW",
        deployment_maturity="MATURE" if has_docker and "READY" in prod_ready else "DEVELOPING",
        maintainability_grade=grade,
        maintainability_score=round(m_score, 1),
        business_impact="HIGH" if grade in ["A", "B"] else "MEDIUM",
        operational_complexity="HIGH" if debt > 30 else "LOW",
        refactoring_effort_days=round(debt * 0.8, 1),
        key_insights=insights
    )

def assess_business_value(ri_result: Optional[RIResult], council_verdict: Optional[Dict] = None) -> Dict[str, Any]:
    """Module entry point for business assessment."""
    val = compute_business_value(ri_result, council_verdict)
    return val.__dict__
