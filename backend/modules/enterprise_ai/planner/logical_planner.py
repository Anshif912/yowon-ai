"""
planner/logical_planner.py — Persona-Aware Query Planner

Routes queries to the correct tools based on persona permissions and query keywords.
Only selects tools the persona is authorized to use.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger("yowon.ai.planner")


class LogicalPlanner:
    # Keyword → tool affinity map
    TOOL_KEYWORDS: Dict[str, List[str]] = {
        "predictions_tool":          ["predict", "readiness", "debt", "forecast", "score", "technical", "cost"],
        "digital_twin_tool":         ["twin", "simulation", "simulate", "process", "workflow", "cycle", "latency"],
        "knowledge_tool":            ["search", "knowledge", "file", "code", "repository", "find", "document"],
        "portfolio_tool":            ["portfolio", "projects", "overview", "summary", "all projects", "maturity"],
        "project_dna_tool":          ["dna", "fingerprint", "features", "compare", "version", "composition"],
        "decision_intelligence_tool":["decision", "judge", "evaluate", "score", "record", "replay", "history"],
        "security_scanner_tool":     ["security", "vulnerability", "exploit", "scan", "risk", "dependency", "cve"],
        "vault_inspection_tool":     ["vault", "secret", "credential", "rotation", "stale", "token", "key"],
        "governance_tool":           ["governance", "compliance", "policy", "approval", "workflow", "regulation"],
        "metrics_tool":              ["metric", "coverage", "complexity", "duplication", "loc", "lines", "quality"],
    }

    def create_plan(
        self,
        query: str,
        available_tools: List[Dict[str, str]],
        persona_tool_permissions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generates an ordered execution plan for the given query.
        Only selects tools that are in the persona's tool_permissions list.
        """
        lowered = query.lower()
        permitted = set(persona_tool_permissions or [t["name"] for t in available_tools])
        registered_names = {t["name"] for t in available_tools}

        # Score each permitted tool by keyword affinity
        scored: List[tuple] = []
        for tool_name, keywords in self.TOOL_KEYWORDS.items():
            if tool_name not in permitted:
                continue
            if tool_name not in registered_names:
                continue
            score = sum(1 for kw in keywords if kw in lowered)
            if score > 0:
                scored.append((score, tool_name))

        # Sort highest-scoring first, cap at 3 tools per query
        scored.sort(key=lambda x: x[0], reverse=True)
        selected_tools = [name for _, name in scored[:3]]

        # Fallback: if no keywords matched, use the first permitted tool
        if not selected_tools:
            fallback = next(
                (t for t in permitted if t in registered_names), None
            )
            if fallback:
                selected_tools = [fallback]

        steps = [
            {
                "step_id": i + 1,
                "tool": tool_name,
                "purpose": f"Execute {tool_name} to address query.",
                "depends_on": [i] if i > 0 else [],
            }
            for i, tool_name in enumerate(selected_tools)
        ]

        logger.info(f"[Planner] Query='{query[:60]}...' → tools={selected_tools}")

        return {
            "query": query,
            "steps": steps,
            "is_achievable": len(steps) > 0,
        }
