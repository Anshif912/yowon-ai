"""
orchestrator/coordinator.py — Persona-Aware AI Coordinator

Orchestrates: persona loading → context building → planning → tool execution
→ evidence aggregation → structured response formatting.
"""

import logging
import json
from typing import Dict, Any, List

from modules.enterprise_ai.planner.logical_planner import LogicalPlanner
from modules.enterprise_ai.tools.registry import tool_registry
from modules.enterprise_ai.personas.registry import get_persona

logger = logging.getLogger("yowon.ai.coordinator")


class AICoordinator:
    def __init__(self):
        self.planner = LogicalPlanner()

    async def coordinate_execution(
        self,
        query: str,
        context: Dict[str, Any],
        persona_id: str = "developer"
    ) -> Dict[str, Any]:
        """
        Orchestrates the full Copilot execution pipeline:
        1. Load persona config
        2. Create persona-aware execution plan
        3. Execute permitted tools
        4. Aggregate evidence
        5. Format structured response
        """
        persona = get_persona(persona_id)
        tools_metadata = tool_registry.list_tools()
        plan = self.planner.create_plan(
            query,
            tools_metadata,
            persona_tool_permissions=persona["tool_permissions"]
        )

        logger.info(
            f"[Coordinator] persona={persona_id} query='{query[:60]}' "
            f"steps={len(plan['steps'])}"
        )

        executions: List[Dict[str, Any]] = []
        all_evidence: List[Dict[str, Any]] = []
        tool_summaries: List[str] = []

        for step in plan["steps"]:
            tool_name = step["tool"]
            tool_obj = tool_registry.get_tool(tool_name)

            if tool_obj:
                try:
                    logger.info(f"[Coordinator] Executing tool: {tool_name}")
                    result = await tool_obj.execute({"query": query}, context)
                    tool_summary = result.get("summary", f"{tool_name} completed.")
                    tool_summaries.append(tool_summary)
                    all_evidence.extend(result.get("evidence", []))
                    executions.append({
                        "step_id": step["step_id"],
                        "tool": tool_name,
                        "status": "success",
                        "output": result
                    })
                except Exception as exc:
                    logger.error(f"[Coordinator] Tool {tool_name} failed: {exc}")
                    executions.append({
                        "step_id": step["step_id"],
                        "tool": tool_name,
                        "status": "failed",
                        "error": str(exc)
                    })
            else:
                logger.warning(f"[Coordinator] Tool '{tool_name}' not registered.")
                executions.append({
                    "step_id": step["step_id"],
                    "tool": tool_name,
                    "status": "not_available",
                    "output": {"summary": f"Tool '{tool_name}' is not available for this persona."}
                })

        # Format structured response from persona system prompt + tool summaries
        response_text = self._format_response(
            query=query,
            persona=persona,
            tool_summaries=tool_summaries,
            executions=executions,
            evidence=all_evidence,
            context=context
        )

        return {
            "query": query,
            "persona_id": persona_id,
            "persona_name": persona["name"],
            "plan": plan,
            "executions": executions,
            "evidence": all_evidence,
            "response": response_text,
            "status": "completed"
        }

    def _format_response(
        self,
        query: str,
        persona: Dict[str, Any],
        tool_summaries: List[str],
        executions: List[Dict[str, Any]],
        evidence: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> str:
        """
        Assembles a structured, evidence-backed response from tool results.
        Uses template synthesis — deterministic, grounded in real data.
        """
        lines: List[str] = []

        # Header: persona framing
        workspace_id = context.get("workspace_id", "workspace")
        project_count = len(context.get("projects", []))
        lines.append(f"**{persona['name']}** — Workspace Analysis")
        lines.append(f"_Workspace: `{workspace_id}` · {project_count} project(s) in scope_")
        lines.append("")

        if not tool_summaries:
            lines.append(
                f"I analyzed your workspace for: _{query}_\n\n"
                "No data sources matched the query for this persona. "
                "Ensure your workspace has connected repositories and submitted projects."
            )
            return "\n".join(lines)

        # Tool findings
        lines.append("### Findings")
        for i, summary in enumerate(tool_summaries, 1):
            lines.append(f"{i}. {summary}")

        lines.append("")

        # Specific rich context per execution
        for execution in executions:
            if execution.get("status") != "success":
                continue
            output = execution.get("output", {})
            tool = execution.get("tool", "")

            if tool == "predictions_tool":
                debt = output.get("technical_debt", {})
                readiness = output.get("readiness_forecast", {})
                if debt:
                    lines.append("### Technical Debt Analysis")
                    lines.append(f"- Debt hours estimated: **{debt.get('debt_hours', 0):.0f}h**")
                    lines.append(f"- Estimated cost: **${debt.get('debt_cost_usd', 0):,.0f}**")
                    lines.append(f"- Debt ratio: **{debt.get('debt_ratio_percentage', 0):.1f}%** of build investment")
                if readiness:
                    lines.append(f"- Readiness score: **{readiness.get('readiness_score', 0)}/100** — `{readiness.get('status', 'UNKNOWN')}`")
                lines.append("")

            elif tool == "portfolio_tool":
                summary_data = output.get("portfolio_summary", {})
                if summary_data:
                    lines.append("### Portfolio Overview")
                    lines.append(f"- Total projects: **{summary_data.get('total_projects', 0)}**")
                    lines.append(f"- Evaluated: **{summary_data.get('evaluated', 0)}**")
                    lines.append(f"- Pending: **{summary_data.get('pending_evaluation', 0)}**")
                    if summary_data.get("average_score"):
                        lines.append(f"- Average score: **{summary_data['average_score']}/100**")
                lines.append("")

            elif tool == "security_scanner_tool":
                risk = output.get("risk_level", "UNKNOWN")
                vulns = output.get("total_vulnerabilities", 0)
                risky = output.get("risky_projects", [])
                lines.append("### Security Assessment")
                lines.append(f"- Risk level: **`{risk}`**")
                lines.append(f"- Total vulnerabilities: **{vulns}**")
                if risky:
                    for rp in risky[:3]:
                        lines.append(f"  - ⚠ `{rp['project']}` — {rp['vulnerability_count']} vuln(s)")
                lines.append("")

            elif tool == "metrics_tool":
                m = output.get("metrics", {})
                if m:
                    lines.append("### Code Quality Metrics")
                    lines.append(f"- Lines of code: **{m.get('lines_of_code', 0):,}**")
                    lines.append(f"- Test coverage: **{m.get('test_coverage_percentage', 0):.1f}%**")
                    lines.append(f"- Duplication: **{m.get('code_duplication_percentage', 0):.1f}%**")
                    lines.append(f"- Cyclomatic complexity: **{m.get('cyclomatic_complexity', 0):.1f}**")
                lines.append("")

            elif tool == "vault_inspection_tool":
                vault = output.get("vault_summary", {})
                if vault:
                    lines.append("### Secrets Vault Status")
                    lines.append(f"- Total secrets: **{vault.get('total_secrets', 0)}**")
                    stale = vault.get("stale_secrets", 0)
                    if stale > 0:
                        lines.append(f"- ⚠ **{stale} secrets** have not been rotated in 30+ days")
                lines.append("")

            elif tool == "knowledge_tool":
                results = output.get("search_results", [])
                if results:
                    lines.append("### Relevant Repository Files")
                    for r in results[:3]:
                        path = r.get("file_path") or r.get("title", "unknown")
                        score = r.get("hybrid_score", 0)
                        lines.append(f"- `{path}` — relevance: **{score:.0%}**")
                lines.append("")

            elif tool == "decision_intelligence_tool":
                decisions = output.get("decisions", [])
                if decisions:
                    lines.append("### Recent Decisions")
                    for d in decisions[:3]:
                        lines.append(f"- **{d.get('title', 'Decision')}** — Score: {d.get('score', 'N/A')}/100")
                lines.append("")

        # Evidence citations
        if evidence:
            lines.append("---")
            lines.append("### Evidence References")
            for ev in evidence[:8]:
                ev_type = ev.get("evidence_type", "REF")
                ev_id = ev.get("evidence_id", "")
                ev_label = ev.get("label", ev_id)
                confidence = ev.get("confidence", 0.0)
                lines.append(f"- `[{ev_type}]` {ev_label} · confidence: **{confidence:.0%}**")

        # Suggested follow-ups
        lines.append("")
        lines.append("---")
        lines.append("**Suggested next questions:**")
        suggestions = self._get_suggestions(persona["id"], executions)
        for s in suggestions:
            lines.append(f"- _{s}_")

        return "\n".join(lines)

    def _get_suggestions(self, persona_id: str, executions: List[Dict[str, Any]]) -> List[str]:
        """Returns 3 contextual follow-up suggestions based on persona and tools used."""
        suggestions_map: Dict[str, List[str]] = {
            "cto": [
                "What is the current technical debt cost for the entire portfolio?",
                "Which projects are at risk of missing their release readiness targets?",
                "Show me the digital twin process simulation for the last sprint.",
            ],
            "developer": [
                "Which files have the highest cyclomatic complexity?",
                "Find all files with test coverage below 60%.",
                "What dependency vulnerabilities were detected in the latest scan?",
            ],
            "judge": [
                "Compare DNA profiles between the last two submitted versions.",
                "What was the decision score for the most recent project evaluation?",
                "Show the confidence breakdown for the last AI judgment.",
            ],
            "security": [
                "Which secrets in the vault are overdue for rotation?",
                "Are there any high-severity vulnerabilities in the active projects?",
                "Show me the governance compliance status for this workspace.",
            ],
            "architect": [
                "Which services have the highest latency in the digital twin simulation?",
                "What design patterns are present across the connected repositories?",
                "Identify coupling issues between the main microservices.",
            ],
        }
        return suggestions_map.get(persona_id, [
            "What is the current workspace health status?",
            "Show me the latest evaluation results.",
            "What are the top risks in this workspace?",
        ])
