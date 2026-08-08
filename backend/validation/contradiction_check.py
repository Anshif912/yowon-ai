"""
Contradiction detection and self-correction pass for YOWON AI report narratives.
Ensures qualitative narrative sections are fully aligned with deterministic scores.
"""

from __future__ import annotations

import json
from typing import Any
from llm_utils import invoke_direct_llm
from logging_config import get_logger

logger = get_logger(__name__)

def check_and_correct_contradictions(
    verdict_dict: dict[str, Any],
    computed: dict[str, Any],
    evidence_graph: str
) -> dict[str, Any]:
    """
    Validates report sections for contradictions.
    Regenerates only the conflicting sections if any exist.
    """
    verdict = verdict_dict.get("verdict", "IMPROVE")
    score = verdict_dict.get("overall_score", 50)
    sections = verdict_dict.get("reasoning_sections", {})
    
    if not sections:
        return verdict_dict

    conflicts = []
    
    # Rule 1: Verdict vs Deployment Readiness
    exec_sec = sections.get("executive")
    if exec_sec:
        readiness = str(exec_sec.get("deployment_readiness", "")).lower()
        if verdict == "REJECT" and any(w in readiness for w in ("ready for prod", "fully ready", "approved", "acceptable")):
            conflicts.append(("executive", "Executive states project is ready but overall verdict is REJECT."))
        elif verdict == "ACCEPT" and any(w in readiness for w in ("unacceptable", "not ready", "rejected", "blocked")):
            conflicts.append(("executive", "Executive states project is not ready but overall verdict is ACCEPT."))

    # Rule 2: Security section vs sentinel score
    sec_sec = sections.get("security")
    sec_score = computed.get("agent_scores", {}).get("security", 100)
    if sec_sec:
        summary = str(sec_sec.get("summary", "")).lower()
        if sec_score < 40 and "no critical issues" in summary:
            conflicts.append(("security", "Security score is critically low but narrative claims no major issues exist."))

    # Rule 3: Architecture summary vs Forge score
    arch_sec = sections.get("architecture")
    arch_score = computed.get("agent_scores", {}).get("technical", 100)
    if arch_sec:
        summary = str(arch_sec.get("summary", "")).lower()
        if arch_score < 45 and any(w in summary for w in ("excellent design", "highly modular", "fully optimized")):
            conflicts.append(("architecture", "Architecture score is low but narrative claims architecture is fully optimized."))

    if not conflicts:
        logger.info("[Contradiction Check] Narrative is fully aligned with scores. No contradictions detected.")
        return verdict_dict

    logger.warning("[Contradiction Check] Found %d narrative contradiction(s): %s", len(conflicts), conflicts)
    
    # Phase 10: Correct conflicting sections using a direct LLM call
    for section_name, reason in conflicts:
        logger.info("[Contradiction Correction] Regenerating section: %s", section_name)
        corrected_section = _correct_section_via_llm(
            section_name=section_name,
            reason=reason,
            verdict=verdict,
            score=score,
            section_data=sections[section_name],
            evidence_graph=evidence_graph
        )
        if corrected_section:
            sections[section_name] = corrected_section

    verdict_dict["reasoning_sections"] = sections
    return verdict_dict


def _correct_section_via_llm(
    section_name: str,
    reason: str,
    verdict: str,
    score: int,
    section_data: dict[str, Any],
    evidence_graph: str
) -> dict[str, Any] | None:
    """Invokes direct LLM pass to rewrite a single section to align with verdict."""
    system_prompt = (
        "You are an enterprise Software Audit Expert. Your task is to resolve contradiction warnings in audit reports.\n"
        "You must rewrite the supplied report section JSON to be fully aligned with the overall consensus verdict and score.\n"
        "DO NOT modify keys or schemas, and DO NOT invent any facts not supported by the evidence graph.\n"
    )
    
    user_prompt = (
        f"--- AUDIT WARNING ---\n"
        f"Contradiction identified: {reason}\n\n"
        f"--- TARGET ALIGNMENT ---\n"
        f"Consensus Verdict: {verdict}\n"
        f"Overall Score: {score}/100\n\n"
        f"--- ORIGINAL SECTION DATA ---\n"
        f"{json.dumps(section_data, indent=2)}\n\n"
        f"--- EVIDENCE GRAPH ---\n"
        f"{evidence_graph}\n\n"
        f"Rewrite this section JSON to align with the verdict. Return ONLY the valid JSON block for this section. "
        f"Start with {{ and end with }}. Do not output markdown, preambles, or formatting backticks."
    )
    
    try:
        raw_res = invoke_direct_llm(
            role="chief",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            label=f"contradiction:fix:{section_name}"
        )
        
        # Strip codeblocks if present
        raw_res = raw_res.strip()
        if raw_res.startswith("```"):
            import re
            raw_res = re.sub(r"^```(?:json)?\s*", "", raw_res)
            raw_res = re.sub(r"\s*```$", "", raw_res)
            
        parsed = json.loads(raw_res)
        if isinstance(parsed, dict) and "summary" in parsed:
            logger.info("[Contradiction Correction] Successfully corrected section %s", section_name)
            return parsed
    except Exception as exc:
        logger.error("[Contradiction Correction] Failed to correct section %s: %s", section_name, exc)
        
    return None
