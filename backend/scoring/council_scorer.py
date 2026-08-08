"""
council_scorer.py
Dynamic scoring module for the YOWON AI council of agents based on RepositoryIntelligenceResult.
"""

from typing import Dict, List, Any, Optional
import math
from dataclasses import dataclass

from intelligence.ri_contract import RIResult

AGENT_WEIGHTS = {
    "forge": 0.25,
    "sentinel": 0.20,
    "guardian": 0.15,
    "visionary": 0.15,
    "prime": 0.15,
    "showcase": 0.10
}

def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def compute_forge_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Forge (Technical) score."""
    formula = [
        {"dimension": "Code Volume", "weight_pct": 30},
        {"dimension": "AST Structure", "weight_pct": 30},
        {"dimension": "Test Coverage", "weight_pct": 20},
        {"dimension": "Modular Architecture", "weight_pct": 20}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
    
    diag = ri_result.diagnostics
    if not diag:
        return {
            "score": 0.0,
            "reason": "No diagnostics available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
        
    metrics_used = ["total_functions", "total_classes", "total_loc", "total_files"]
    findings = []
    breakdown = []
    
    score = 0.0
    
    if diag.total_loc > 0:
        loc_delta = min(30.0, (diag.total_loc / 1000) * 10)
        score += loc_delta
        findings.append(f"Analyzed {diag.total_loc} lines of code across {diag.total_files} files.")
        breakdown.append({"label": "Lines of code volume", "delta": round(loc_delta, 1), "source": "AST Parser"})
    
    if diag.total_classes > 0 or diag.total_functions > 0:
        ast_delta = min(30.0, ((diag.total_classes * 5 + diag.total_functions) / 50) * 10)
        score += ast_delta
        findings.append(f"Detected {diag.total_classes} classes and {diag.total_functions} functions indicating structured code.")
        breakdown.append({"label": "AST Symbol density", "delta": round(ast_delta, 1), "source": "AST Parser"})
        
    test_files = sum(1 for node in ri_result.repository_tree if "test" in node.get("name", "").lower())
    if diag.total_files > 0:
        test_ratio = test_files / diag.total_files
        test_delta = min(20.0, (test_ratio / 0.2) * 20)
        score += test_delta
        if test_files > 0:
            findings.append(f"Found {test_files} test files (ratio: {test_ratio:.2f}).")
            metrics_used.append("test_ratio")
            breakdown.append({"label": "Test file ratio", "delta": round(test_delta, 1), "source": "Rule Engine"})
            
    arch_nodes = len(ri_result.architecture_graph.get("nodes", [])) if ri_result.architecture_graph else 0
    if arch_nodes > 0:
        arch_delta = min(20.0, (arch_nodes / 10) * 20)
        score += arch_delta
        findings.append(f"Identified {arch_nodes} architectural components indicating modular design.")
        metrics_used.append("architecture_nodes")
        breakdown.append({"label": "Modular architecture graph", "delta": round(arch_delta, 1), "source": "Knowledge Graph"})
        
    score = min(100.0, score)
    confidence = min(100.0, 50.0 + (diag.total_files / 100) * 50) if diag.total_files > 0 else 0.0
    
    return {
        "score": round(score, 2),
        "reason": f"Technical score computed based on {diag.total_loc} LOC, {diag.total_classes} classes, and {arch_nodes} architecture nodes.",
        "confidence": round(confidence, 2),
        "findings": findings,
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_sentinel_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Sentinel (Security) score."""
    formula = [
        {"dimension": "Baseline Security", "weight_pct": 100}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
    
    findings = []
    breakdown = []
    metrics_used = ["security_findings"]
    
    base_score = 100.0
    critical = 0
    high = 0
    medium = 0
    
    for finding in (ri_result.security_findings or []):
        sev = finding.get("severity", "LOW").upper()
        desc = finding.get("description", "Unknown security finding")
        if sev == "CRITICAL":
            critical += 1
            findings.append(f"CRITICAL: {desc}")
        elif sev == "HIGH":
            high += 1
            findings.append(f"HIGH: {desc}")
        elif sev == "MEDIUM":
            medium += 1
            findings.append(f"MEDIUM: {desc}")
            
    for ev in ri_result.evidence:
        if ev.severity.upper() in ["CRITICAL", "HIGH", "MEDIUM"] and any(term in ev.rule_id.lower() for term in ["sec", "auth", "vuln"]):
            sev = ev.severity.upper()
            if sev == "CRITICAL": critical += 1
            elif sev == "HIGH": high += 1
            elif sev == "MEDIUM": medium += 1
            findings.append(f"{sev} Risk in {ev.file_path}: {ev.rule_id}")
            
    crit_penalty = critical * 20
    high_penalty = high * 10
    med_penalty = medium * 5
    penalty = crit_penalty + high_penalty + med_penalty
    score = max(0.0, base_score - penalty)
    
    breakdown.append({"label": "Initial Baseline security", "delta": 100.0, "source": "Rule Engine"})
    if critical > 0:
        breakdown.append({"label": "Critical severity penalties", "delta": -float(crit_penalty), "source": "Security Scanner"})
    if high > 0:
        breakdown.append({"label": "High severity penalties", "delta": -float(high_penalty), "source": "Security Scanner"})
    if medium > 0:
        breakdown.append({"label": "Medium severity penalties", "delta": -float(med_penalty), "source": "Security Scanner"})
        
    reason = f"Security score is {score} after applying penalties for {critical} critical, {high} high, and {medium} medium vulnerabilities."
    if score == 100.0:
        reason = "No significant security vulnerabilities found, maintaining perfect score."
        findings.append("No critical, high, or medium security risks detected.")
        
    confidence = 80.0 if (ri_result.diagnostics and ri_result.diagnostics.total_files > 0) else 0.0
    
    return {
        "score": round(score, 2),
        "reason": reason,
        "confidence": confidence,
        "findings": findings[:5],
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_guardian_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Guardian (Scalability) score."""
    formula = [
        {"dimension": "Concurrency", "weight_pct": 20},
        {"dimension": "Caching", "weight_pct": 20},
        {"dimension": "Data Access", "weight_pct": 20},
        {"dimension": "Virtualization", "weight_pct": 20},
        {"dimension": "Topology", "weight_pct": 20}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
        
    score = 0.0
    findings = []
    breakdown = []
    metrics_used = []
    
    techs = [t.lower() for t in ri_result.detected_technologies]
    arch_nodes = ri_result.architecture_graph.get("nodes", []) if ri_result.architecture_graph else []
    
    has_async = any("async" in t or "celery" in t or "rabbitmq" in t or "kafka" in t for t in techs)
    if has_async:
        score += 20
        findings.append("Detected asynchronous processing patterns.")
        metrics_used.append("async_patterns")
        breakdown.append({"label": "Asynchronous design patterns", "delta": 20.0, "source": "Dependency Scanner"})
        
    has_caching = any("redis" in t or "memcached" in t or "cache" in t for t in techs)
    if has_caching:
        score += 20
        findings.append("Detected caching layer.")
        metrics_used.append("caching_layer")
        breakdown.append({"label": "Caching layer integration", "delta": 20.0, "source": "Dependency Scanner"})
        
    db_pooling = any("db" in t or "sql" in t or "postgres" in t or "mongo" in t for t in techs)
    if db_pooling:
        score += 20
        findings.append("Database connectivity detected, likely supporting pooling.")
        metrics_used.append("db_pooling")
        breakdown.append({"label": "Database connection pooling", "delta": 20.0, "source": "Dependency Scanner"})
        
    has_container = any("docker" in t or "kubernetes" in t for t in techs)
    if has_container:
        score += 20
        findings.append("Containerization support detected.")
        metrics_used.append("containerization")
        breakdown.append({"label": "Container deployment support", "delta": 20.0, "source": "Rule Engine"})
        
    load_handling = len(arch_nodes) > 3
    if load_handling:
        score += 20
        findings.append(f"Architecture contains {len(arch_nodes)} components, suitable for distributed load.")
        metrics_used.append("load_handling")
        breakdown.append({"label": "Distributed architecture components", "delta": 20.0, "source": "Knowledge Graph"})
        
    confidence = 85.0 if ri_result.diagnostics else 0.0
    
    return {
        "score": round(min(100.0, score), 2),
        "reason": f"Scalability score derived from presence of containerization ({has_container}), caching ({has_caching}), and async patterns ({has_async}).",
        "confidence": confidence,
        "findings": findings,
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_visionary_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Visionary (Innovation) score."""
    formula = [
        {"dimension": "AI capabilities", "weight_pct": 30},
        {"dimension": "Novelty & Topology", "weight_pct": 25},
        {"dimension": "Modern stack", "weight_pct": 25},
        {"dimension": "DevOps Automation", "weight_pct": 20}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
        
    score = 0.0
    findings = []
    breakdown = []
    metrics_used = []
    
    ai_intel = ri_result.ai_intelligence or {}
    agent_count = ai_intel.get("agent_count", 0)
    has_llm = ai_intel.get("llm_usage", False) or ai_intel.get("vector_db", False)
    
    if agent_count > 0 or has_llm:
        score += 30
        findings.append(f"AI capabilities detected: {agent_count} agents, LLM usage: {has_llm}.")
        metrics_used.append("ai_usage")
        breakdown.append({"label": "AI and LLM integration", "delta": 30.0, "source": "LLM"})
        
    arch_nodes = ri_result.architecture_graph.get("nodes", []) if ri_result.architecture_graph else []
    if len(arch_nodes) > 5:
        score += 25
        findings.append(f"Complex architectural topology with {len(arch_nodes)} nodes.")
        metrics_used.append("architecture_novelty")
        breakdown.append({"label": "Complex architectural topology", "delta": 25.0, "source": "Knowledge Graph"})
        
    techs = [t.lower() for t in ri_result.detected_technologies]
    modern_fw = any(fw in t for t in techs for fw in ["react", "vue", "fastapi", "next", "nest", "graphql"])
    if modern_fw:
        score += 25
        findings.append("Modern frameworks and libraries detected.")
        metrics_used.append("modern_frameworks")
        breakdown.append({"label": "Modern library patterns", "delta": 25.0, "source": "Dependency Scanner"})
        
    automation = any("github-actions" in t or "gitlab-ci" in t or "jenkins" in t for t in techs)
    if automation:
        score += 20
        findings.append("CI/CD and automation detected.")
        metrics_used.append("automation")
        breakdown.append({"label": "CI/CD automation pipelines", "delta": 20.0, "source": "Rule Engine"})
        
    confidence = 80.0 if ri_result.diagnostics else 0.0
    
    return {
        "score": round(min(100.0, score), 2),
        "reason": f"Innovation score reflects AI usage ({has_llm}), architectural novelty ({len(arch_nodes)} nodes), and modern frameworks ({modern_fw}).",
        "confidence": confidence,
        "findings": findings,
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_prime_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Prime (Business/Impact) score."""
    formula = [
        {"dimension": "Production readiness", "weight_pct": 30},
        {"dimension": "Deployment maturity", "weight_pct": 25},
        {"dimension": "Maintainability", "weight_pct": 25},
        {"dimension": "Dependency health", "weight_pct": 20}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
        
    score = 0.0
    findings = []
    breakdown = []
    metrics_used = []
    
    deploy_files = sum(1 for n in ri_result.repository_tree if any(d in n.get("name", "").lower() for d in ["dockerfile", "docker-compose", "k8s", "deploy"]))
    
    if deploy_files > 0:
        score += 30
        findings.append(f"Found {deploy_files} deployment-related files indicating production readiness.")
        metrics_used.append("production_readiness")
        breakdown.append({"label": "Production configuration readiness", "delta": 30.0, "source": "Rule Engine"})
        
    has_docker = any("docker" in t.lower() for t in ri_result.detected_technologies)
    if has_docker:
        score += 25
        findings.append("Docker containerization detected, ensuring deployment maturity.")
        metrics_used.append("deployment_maturity")
        breakdown.append({"label": "Deployment packaging maturity", "delta": 25.0, "source": "Dependency Scanner"})
        
    metrics = ri_result.metrics or {}
    m_score = _safe_float(metrics.get("maintainability", {}).get("score"), 50.0)
    m_delta = (m_score / 100) * 25
    score += m_delta
    findings.append(f"Maintainability baseline score is {m_score}.")
    metrics_used.append("maintainability")
    breakdown.append({"label": "Maintainability score index", "delta": round(m_delta, 1), "source": "Rule Engine"})
    
    diag = ri_result.diagnostics
    if diag and diag.total_dependencies > 0:
        dep_delta = min(20.0, (diag.total_dependencies / 10) * 5)
        score += dep_delta
        findings.append(f"Analyzed {diag.total_dependencies} dependencies for operational context.")
        metrics_used.append("operational_cost")
        breakdown.append({"label": "Dependency ecosystem coverage", "delta": round(dep_delta, 1), "source": "Dependency Scanner"})
        
    confidence = 90.0 if ri_result.diagnostics else 0.0
    
    return {
        "score": round(min(100.0, score), 2),
        "reason": f"Business impact assessed based on {deploy_files} deployment files, Docker presence ({has_docker}), and maintainability metrics.",
        "confidence": confidence,
        "findings": findings,
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_showcase_score(ri_result: Optional[RIResult]) -> Dict[str, Any]:
    """Compute Showcase (Documentation) score."""
    formula = [
        {"dimension": "Readme documentation", "weight_pct": 30},
        {"dimension": "API Coverage", "weight_pct": 25},
        {"dimension": "Code volume reference", "weight_pct": 20},
        {"dimension": "Developer onboarding", "weight_pct": 25}
    ]
    if not ri_result:
        return {
            "score": 0.0,
            "reason": "No repository intelligence data available.",
            "confidence": 0.0,
            "findings": [],
            "metrics_used": [],
            "score_breakdown": [],
            "score_formula": formula
        }
        
    score = 0.0
    findings = []
    breakdown = []
    metrics_used = []
    
    has_readme = any(n.get("name", "").lower() == "readme.md" for n in ri_result.repository_tree)
    if has_readme:
        score += 30
        findings.append("Main README.md file is present.")
        metrics_used.append("readme")
        breakdown.append({"label": "README documentation completeness", "delta": 30.0, "source": "Rule Engine"})
        
    routes = [s for s in ri_result.symbols if s.type == "route"]
    if routes:
        score += 25
        findings.append(f"Extracted {len(routes)} API routes for documentation.")
        metrics_used.append("api_docs")
        breakdown.append({"label": "Self-documenting API routes", "delta": 25.0, "source": "AST Parser"})
        
    diag = ri_result.diagnostics
    if diag and diag.total_loc > 0:
        score += 20
        findings.append("Source code availability indicates potential for self-documenting code.")
        metrics_used.append("comments")
        breakdown.append({"label": "Source code availability index", "delta": 20.0, "source": "AST Parser"})
        
    deploy_files = sum(1 for n in ri_result.repository_tree if "docker" in n.get("name", "").lower() or "setup" in n.get("name", "").lower())
    if deploy_files > 0:
        score += 25
        findings.append("Found setup/deployment files facilitating developer onboarding.")
        metrics_used.append("onboarding")
        breakdown.append({"label": "Onboarding setup files", "delta": 25.0, "source": "Rule Engine"})
        
    confidence = 75.0 if ri_result.diagnostics else 0.0
    
    return {
        "score": round(min(100.0, score), 2),
        "reason": f"Documentation score computed based on README presence ({has_readme}), {len(routes)} API routes, and onboarding files.",
        "confidence": confidence,
        "findings": findings,
        "metrics_used": metrics_used,
        "score_breakdown": breakdown,
        "score_formula": formula
    }

def compute_council_verdict(ri_result: Optional[RIResult], eval_verdict_data: Optional[Dict] = None) -> Dict[str, Any]:
    """Compute the overall council verdict weighting all agent scores."""
    if not ri_result:
        return {
            "council_overall": 0.0,
            "weights": AGENT_WEIGHTS,
            "agents": {},
            "data_quality": "LOW"
        }
        
    agents = {
        "forge": compute_forge_score(ri_result),
        "sentinel": compute_sentinel_score(ri_result),
        "guardian": compute_guardian_score(ri_result),
        "visionary": compute_visionary_score(ri_result),
        "prime": compute_prime_score(ri_result),
        "showcase": compute_showcase_score(ri_result)
    }
    
    overall = sum(agents[a]["score"] * weight for a, weight in AGENT_WEIGHTS.items())
    
    diag = ri_result.diagnostics
    quality = "LOW"
    if diag:
        if diag.total_files > 50 and len(ri_result.detected_technologies) > 2:
            quality = "HIGH"
        elif diag.total_files > 10:
            quality = "MEDIUM"
            
    return {
        "council_overall": round(overall, 2),
        "weights": AGENT_WEIGHTS,
        "agents": agents,
        "data_quality": quality
    }
