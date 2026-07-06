"""Slice project context into compact agent-specific digests."""

from __future__ import annotations

from typing import Any

from config import MAX_AGENT_DIGEST_CHARS, MAX_BRIEF_CHARS


def truncate_text(text: str, limit: int, *, label: str = "text") -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 24] + f"\n...[truncated {label}]"


def _gh_excerpt(ctx: dict[str, Any], readme_limit: int = 900) -> str:
    gh = ctx.get("github") or {}
    if not gh or gh.get("error"):
        return "[No repository data]"
    parts = [
        f"Repo: {gh.get('name', 'unknown')}",
        f"Language: {gh.get('language', 'unknown')}",
        f"Stars: {gh.get('stars', 0)}",
    ]
    stats = gh.get("repository_statistics") or {}
    if stats:
        parts.append(
            "Repository metrics: "
            + ", ".join(
                f"{key}={value}" for key, value in stats.items()
                if key in {
                    "total_files", "code_files", "documentation_files", "test_files",
                    "configuration_files", "deployment_files", "data_files", "meaningful_files",
                }
            )
        )
    if gh.get("readme"):
        parts.append(f"README excerpt:\n{gh['readme'][:readme_limit]}")
    deps = gh.get("dependencies") or {}
    if deps:
        dep_text = "\n".join(f"{k}: {v[:200]}" for k, v in list(deps.items())[:4])
        parts.append(f"Dependencies:\n{dep_text}")
    structure = gh.get("folder_structure") or []
    if structure:
        parts.append("Structure:\n" + "\n".join(structure[:25]))
    return "\n".join(parts)


def _security_digest(ctx: dict[str, Any]) -> str:
    sec = ctx.get("security") or {}
    if not sec:
        return "[No static security scan]"
    lines = [
        f"Risk Level: {sec.get('risk_level', 'N/A')}",
        (sec.get("summary") or "")[:400],
    ]
    for issue in sec.get("secret_findings", [])[:6]:
        lines.append(f"- {issue.get('issue')} @ {issue.get('file')}:{issue.get('line')}")
    for issue in sec.get("bandit_issues", [])[:5]:
        lines.append(f"- Bandit: {issue.get('issue')} ({issue.get('severity')})")
    for w in sec.get("dependency_warnings", [])[:4]:
        lines.append(f"- Dep: {w.get('issue')}")
    return "\n".join(lines)


def _doc_digest(ctx: dict[str, Any]) -> str:
    parts: list[str] = []
    
    # 1. Project info and Description (with demo video and github url if present)
    if ctx.get("project_name"):
        parts.append(f"Project Name: {ctx['project_name']}")
    if ctx.get("description"):
        parts.append(f"Project Description & Presentation Links:\n{ctx['description']}")
        
    # 2. PDF documentation
    pdf = ctx.get("pdf") or {}
    if pdf and not pdf.get("error"):
        parts.append(
            f"PDF Documentation ({pdf.get('page_count', 0)} pages):\n"
            f"{(pdf.get('full_text') or '')[:3500]}"
        )
        
    # 3. PPT slides
    ppt = ctx.get("ppt") or {}
    if ppt and not ppt.get("error"):
        parts.append(
            f"PPT Presentation/Pitch Deck ({ppt.get('slide_count', 0)} slides):\n"
            f"{(ppt.get('full_text') or '')[:3500]}"
        )
        
    # 4. GitHub README
    gh = ctx.get("github") or {}
    if gh and not gh.get("error"):
        if gh.get("readme"):
            parts.append(f"GitHub README documentation:\n{gh['readme'][:2000]}")
        # 5. UI screenshots/images
        source_files = gh.get("source_files") or []
        images = [f["path"] for f in source_files if isinstance(f, dict) and f.get("path") and any(str(f["path"]).lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"))]
        if images:
            parts.append(f"UI Screenshots and Design Assets found in Repository: {', '.join(images[:15])}")
            
    digest_text = "\n\n".join(parts)
    if len(digest_text.strip()) < 100:
        return "[No presentation materials]"
    return digest_text


def _code_intelligence_digest(ctx: dict[str, Any]) -> str:
    code = ctx.get("code_reader") or {}
    arch = ctx.get("architecture") or {}
    evidence = ctx.get("technical_evidence") or {}
    detection = ctx.get("project_type_detection") or {}
    if not any((code, arch, evidence, detection)):
        return "[No code intelligence summary]"
    lines = [
        "Code Reader Summary:",
        code.get("summary", ""),
        "Detected Technologies: " + ", ".join(evidence.get("detected_technologies", []) or code.get("frameworks", []) or []),
        "Detected Algorithms: " + ", ".join(evidence.get("detected_algorithms", []) or code.get("algorithms", []) or []),
        "Architecture: " + arch.get("summary", ""),
        "Evidence Found: " + ", ".join(evidence.get("evidence_found", [])),
        "Evidence Missing: " + ", ".join(evidence.get("evidence_missing", [])),
    ]
    for label, key in (
        ("REST APIs", "rest_apis_found"),
        ("Database Usage", "database_usage"),
        ("Authentication Usage", "authentication_usage"),
        ("Integrations", "integrations"),
    ):
        values = evidence.get(key) or []
        if values:
            lines.append(label + ": " + " | ".join(str(item) for item in values[:4]))
    snippets = evidence.get("top_code_snippets") or code.get("top_code_snippets") or []
    if snippets:
        snippet_lines = []
        for item in snippets[:3]:
            snippet_lines.append(f"{item.get('path')}:\n{str(item.get('snippet') or '')[:700]}")
        lines.append("Top Code Snippets:\n" + "\n\n".join(snippet_lines))
    if detection:
        lines.append(
            f"Project Type Detector: {detection.get('project_type')} "
            f"(confidence={detection.get('confidence')}) - {detection.get('justification', '')}"
        )
    return "\n".join(line for line in lines if line.strip())


def _repository_intelligence_digest(ctx: dict[str, Any], agent: str) -> str:
    intel = ctx.get("repository_intelligence")
    if not intel:
        return ""
        
    lines = ["\n### STRUCTURED REPOSITORY INTELLIGENCE DETECTED:"]
    
    # 1. Health Scores
    health = intel.get("health") or {}
    if health:
        lines.append(f"- Overall Codebase Health: {health.get('overall', 0)}/100")
        lines.append(f"  * Documentation Health: {health.get('documentation', 0)}/100")
        lines.append(f"  * Testing Health: {health.get('testing', 0)}/100")
        lines.append(f"  * Security Health: {health.get('security', 0)}/100")
        lines.append(f"  * Code Quality Health: {health.get('code_quality', 0)}/100")
        
    # 2. Technology & Architecture Graphs
    if agent in ("technical", "innovation", "chief", "narrative"):
        tech_graph = intel.get("technology_graph") or {}
        if tech_graph.get("nodes"):
            techs = [node.get("label") or node.get("id") or "" for node in tech_graph.get("nodes", []) if node.get("type") == "technology"]
            techs = [str(t) for t in techs if t]
            if techs:
                lines.append(f"- Detected Tech Stack Nodes: {', '.join(techs)}")
        arch_graph = intel.get("architecture_graph") or {}
        if arch_graph.get("nodes"):
            layers = [node.get("label") or node.get("id") or "" for node in arch_graph.get("nodes", []) if node.get("type") == "layer"]
            layers = [str(l) for l in layers if l]
            if layers:
                lines.append(f"- Inferred Architecture Layers: {', '.join(layers)}")
                
    # 3. Dependency Warnings
    if agent in ("security", "risk", "chief", "narrative"):
        dep_graph = intel.get("dependency_graph") or {}
        warnings = dep_graph.get("warnings") or []
        if warnings:
            lines.append("- Outdated/Vulnerable Dependency Signals:")
            for w in warnings[:6]:
                lines.append(f"  * {w.get('package')} ({w.get('current_version')}) -> {w.get('warning_type')}: {w.get('message')}")
                
    # 4. Complexity & Metrics
    metrics = intel.get("metrics") or {}
    if metrics:
        total_loc = sum(m.get("loc", 0) for m in metrics.values())
        avg_maintainability = sum(m.get("maintainability_index", 100) for m in metrics.values()) / (len(metrics) or 1)
        lines.append(f"- Codebase Metrics Summary:")
        lines.append(f"  * Total Lines of Code (LOC): {total_loc}")
        lines.append(f"  * Average Maintainability Index: {avg_maintainability:.1f}/100")
        
    # 5. Evidence Records & Code Traces
    evidence = intel.get("evidence") or []
    if evidence:
        lines.append("- Traceable Static Analysis Evidence:")
        for ev in evidence:
            rule_id = ev.get("rule_id", "")
            is_relevant = False
            if agent == "technical" and any(x in rule_id for x in ("FASTAPI", "SQLALCHEMY", "TREE", "METRICS")):
                is_relevant = True
            elif agent == "security" and any(x in rule_id for x in ("SECRET", "UNSAFE_API", "VULNERABILITY", "JWT")):
                is_relevant = True
            elif agent == "risk" and any(x in rule_id for x in ("AUTHENTICATION", "GATEWAY", "CELERY")):
                is_relevant = True
            elif agent in ("innovation", "chief", "narrative"):
                is_relevant = True
                
            if is_relevant:
                lines.append(f"  * [Evidence] File: {ev.get('file_path')} | Rule: {rule_id} | Confidence: {int(ev.get('confidence', 0)*100)}%")
                
    # 6. Recommendations
    recommendations = intel.get("recommendations") or []
    if recommendations:
        lines.append("- Auto-Generated Recommendations:")
        for rec in recommendations:
            is_relevant = False
            category = rec.get("category", "")
            if agent == "technical" and category in ("IMPLEMENTATION", "ARCHITECTURE", "TESTING"):
                is_relevant = True
            elif agent == "security" and category == "SECURITY":
                is_relevant = True
            elif agent == "risk" and category in ("RISK", "SECURITY"):
                is_relevant = True
            elif agent in ("innovation", "chief", "narrative"):
                is_relevant = True
                
            if is_relevant:
                lines.append(f"  * [{rec.get('severity', 'LOW')}] {rec.get('title')}: {rec.get('recommendation')} (Expected Score Gain: +{rec.get('expected_score_gain', 1.0)})")

    return "\n".join(lines)


def slice_context_for_agent(ctx: dict[str, Any], agent: str) -> str:
    brief_parts: list[str] = [
        f"Project: {ctx.get('project_name', 'Unknown')}",
        f"PROJECT_TYPE: {ctx.get('project_type', 'Hackathon Project')}",
    ]

    if agent == "technical":
        brief_parts.append(_gh_excerpt(ctx, readme_limit=1000))
        brief_parts.append(_code_intelligence_digest(ctx))
    elif agent == "security":
        brief_parts.append(_security_digest(ctx))
        brief_parts.append(_code_intelligence_digest(ctx))
        gh = ctx.get("github") or {}
        deps = gh.get("dependencies") or {}
        if deps:
            brief_parts.append(
                "Dependency files:\n"
                + "\n".join(f"{k}:\n{v[:250]}" for k, v in list(deps.items())[:3])
            )
    elif agent == "presentation":
        brief_parts.append(_doc_digest(ctx))
    elif agent == "innovation":
        brief_parts.append((ctx.get("description") or "")[:400])
        brief_parts.append(_code_intelligence_digest(ctx))
        gh = ctx.get("github") or {}
        if gh and not gh.get("error"):
            topics = ", ".join(gh.get("topics", [])[:8])
            brief_parts.append(f"Topics: {topics}")
            brief_parts.append(_gh_excerpt(ctx, readme_limit=700))
    elif agent == "risk":
        brief_parts.append((ctx.get("description") or "")[:350])
        brief_parts.append(_security_digest(ctx)[:500])
        brief_parts.append(_gh_excerpt(ctx, readme_limit=500))
        brief_parts.append(_code_intelligence_digest(ctx))
    else:
        brief_parts.append(_gh_excerpt(ctx, readme_limit=600))
        brief_parts.append(_doc_digest(ctx))
        brief_parts.append(_code_intelligence_digest(ctx))

    # Append structured repository intelligence digest to the agent slice
    intel_digest = _repository_intelligence_digest(ctx, agent)
    if intel_digest:
        brief_parts.append(intel_digest)

    text = "\n\n".join(brief_parts)
    return truncate_text(text, MAX_AGENT_DIGEST_CHARS, label=f"digest:{agent}")


def truncate_brief(brief_text: str) -> str:
    return truncate_text(brief_text, MAX_BRIEF_CHARS, label="brief")
