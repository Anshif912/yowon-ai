"""CrewAI tasks — JSON via prompts; parsed in crew.py (not CrewAI output_json)."""

from __future__ import annotations

import json
from crewai import Agent, Task

from eval_context.context_slicer import truncate_brief, truncate_text
from config import MAX_AGENT_DIGEST_CHARS
from eval_context.prompt_registry import get_template_and_meta

_JSON_RULES = get_template_and_meta("common_rules")["template"]


def _prep(brief: str, digest: str) -> tuple[str, str]:
    return truncate_brief(brief), truncate_text(digest, MAX_AGENT_DIGEST_CHARS, label="evidence")


def create_technical_task(agent: Agent, brief: str, digest: str) -> Task:
    brief, digest = _prep(brief, digest)
    template = get_template_and_meta("technical_task")["template"]
    description = template.format(brief=brief, digest=digest)
    return Task(
        description=description + "\n" + _JSON_RULES,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_security_task(agent: Agent, brief: str, digest: str) -> Task:
    brief, digest = _prep(brief, digest)
    template = get_template_and_meta("security_task")["template"]
    description = template.format(brief=brief, digest=digest)
    return Task(
        description=description + "\n" + _JSON_RULES,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_innovation_task(agent: Agent, brief: str, digest: str) -> Task:
    brief, digest = _prep(brief, digest)
    template = get_template_and_meta("innovation_task")["template"]
    description = template.format(brief=brief, digest=digest)
    return Task(
        description=description + "\n" + _JSON_RULES,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_presentation_task(agent: Agent, brief: str, digest: str) -> Task:
    brief, digest = _prep(brief, digest)
    template = get_template_and_meta("presentation_task")["template"]
    description = template.format(brief=brief, digest=digest)
    return Task(
        description=description + "\n" + _JSON_RULES,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_risk_task(agent: Agent, brief: str, digest: str) -> Task:
    brief, digest = _prep(brief, digest)
    template = get_template_and_meta("risk_task")["template"]
    description = template.format(brief=brief, digest=digest)
    return Task(
        description=description + "\n" + _JSON_RULES,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_chief_evaluation_task(
    agent: Agent,
    specialist_summary: str,
    computed: dict,
) -> Task:
    # Chief only generates narrative synthesis. Scores are computed deterministically in Python.
    specialist_summary = specialist_summary[:3500]
    computed_json = json.dumps(computed, indent=2)
    description = (
        "You are the Chief Evaluation Officer. Do NOT change any numeric scores.\n"
        "Using the specialist reports below, produce only the following JSON fields:\n"
        "- executive_summary (2-3 sentences)\n"
        "- top_strengths (array of strings, max 5)\n"
        "- top_weaknesses (array of strings, max 5)\n"
        "- contradictions (array of strings)\n"
        "- blocking_issues (array of strings)\n"
        "- recommended_fixes (array of strings, max 5)\n"
        "- roadmap (array of strings, max 6; action items only, not one long string)\n"
        "- deployment_roadmap (same array as roadmap for backward compatibility)\n\n"
        "Specialist jury reports:\n"
        f"{specialist_summary}\n\n"
        "Pre-computed scores (for reference only, DO NOT MODIFY):\n"
        f"{computed_json}\n\n"
        "Return a single JSON object only. No markdown, no explanation. Start with { and end with }."
    )
    return Task(
        description=description,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )


def create_narrative_task(agent: Agent, numeric_summary: dict, evidence_graph: str) -> Task:
    # numeric_summary should contain overall_score, verdict, risk_level, agent_scores
    brief = json.dumps(numeric_summary, indent=2)
    user_text = (
        "You are YOWON Prime, the Chief Evaluation Officer. You are running a single-pass Enterprise Report Reasoning Engine.\n"
        "Your task is to analyze the Structured Evidence Graph, perform an internal reasoning step, and project the final report JSON.\n\n"
        "--- STRUCTURED EVIDENCE GRAPH ---\n"
        f"{evidence_graph}\n\n"
        "--- NUMERIC SUMMARY (DO NOT MODIFY SCORES) ---\n"
        f"{brief}\n\n"
        "--- CORE MANDATES ---\n"
        "1. SINGLE REASONING PASS: Review the entire Evidence Graph first. Make sure all findings are mutually aligned. No section should contradict another.\n"
        "2. AUDIENCE SENSITIVITY: Write for the target audience: CTO, Executive Board, and Senior Engineering Leadership.\n"
        "3. ROLE PERSONAS & STYLES:\n"
        "   - 'executive' -> Written by CEO / CTO (Executive-level business & technology consensus review)\n"
        "   - 'architecture' -> Written by Principal Software Architect (Technical review of modularity, patterns, complexity)\n"
        "   - 'security' -> Written by Principal Security Engineer (Risk-focused audit of vulnerabilities, credentials, threat surface)\n"
        "   - 'innovation' -> Written by AI Research Director (Research-oriented novelty, differentiators, framework comparison)\n"
        "   - 'business' -> Written by VP Engineering (Developer velocity, estimated tech debt remediation ROI, engineering impact)\n"
        "   - 'risk' -> Written by Enterprise Risk Officer (Operational deployment risk, environment drift, recovery policies)\n"
        "   - 'recommendations' -> Written by Staff Engineer (Action-oriented, prioritized actionable task checklist)\n"
        "4. DYNAMIC CARD TITLES: Do NOT output hardcoded section titles like 'Business Intelligence' or 'Innovation Analysis'. Dynamically construct descriptive, repository-specific titles for each section (e.g. 'Cloud Native Deployment Risk Profile', 'Python Microservice Architecture Review').\n"
        "5. NO BOILERPLATE: You are strictly forbidden from starting paragraphs with any of the following canned phrases:\n"
        "   - 'This repository...'\n"
        "   - 'Overall...'\n"
        "   - 'The analysis indicates...'\n"
        "   - 'Based on the evaluation...'\n"
        "   - 'This project demonstrates...'\n"
        "   - 'This repository demonstrates...'\n"
        "   Write fresh, natural, distinct sentences specifically for this codebase.\n"
        "6. STRICT HALLUCINATION GUARD: You may ONLY discuss tools, libraries, file paths, security vulnerabilities, or frameworks that are explicitly evidenced in the Structured Evidence Graph. If evidence is insufficient, set 'summary' to 'Available repository evidence is insufficient to support a confident conclusion in this section.' and leave all lists/arrays empty. Never invent Docker, Kubernetes, Redis, databases, or CI/CD files unless present.\n\n"
        "--- JSON SCHEMA OUTLINE ---\n"
        "Return ONLY a single valid JSON object structured as follows. No markdown formatting, no preambles, start with { and end with }:\n"
        "{\n"
        "  \"hidden_reasoning\": \"<2-3 sentences of internal cross-agent contradiction resolution and engineering impact assessment>\",\n"
        "  \"executive_summary\": \"<Overall executive briefing synthesis>\",\n"
        "  \"top_strengths\": [\"Strength 1\", \"Strength 2\"],\n"
        "  \"top_weaknesses\": [\"Weakness 1\", \"Weakness 2\"],\n"
        "  \"recommended_fixes\": [\"Fix 1\", \"Fix 2\"],\n"
        "  \"roadmap\": [\"Action item 1\", \"Action item 2\"],\n"
        "  \"deployment_roadmap\": [\"Action item 1\", \"Action item 2\"],\n"
        "  \"reasoning_sections\": {\n"
        "    \"executive\": {\n"
        "      \"title\": \"<Dynamic executive verdict title>\",\n"
        "      \"summary\": \"<Summary matching CEO/CTO persona>\",\n"
        "      \"executive_takeaway\": \"<Critical takeaway for board review>\",\n"
        "      \"positive_findings\": [\"Finding A\", \"Finding B\"],\n"
        "      \"negative_findings\": [\"Finding C\"],\n"
        "      \"technical_observations\": [\"Observation 1\"],\n"
        "      \"business_implications\": [\"Implication 1\"],\n"
        "      \"deployment_readiness\": \"<Readiness rating statement>\",\n"
        "      \"recommended_actions\": [\"Action 1\"],\n"
        "      \"citations\": [\"Citing agent or evidence name\"],\n"
        "      \"confidence\": \"<High/Moderate/Low with brief reason>\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"architecture\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching Principal Software Architect persona>\",\n"
        "      \"executive_takeaway\": \"<Takeaway>\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"security\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching Principal Security Engineer persona>\",\n"
        "      \"executive_takeaway\": \"...\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"business\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching VP Engineering persona>\",\n"
        "      \"executive_takeaway\": \"...\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"innovation\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching AI Research Director persona>\",\n"
        "      \"executive_takeaway\": \"...\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"risk\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching Enterprise Risk Officer persona>\",\n"
        "      \"executive_takeaway\": \"...\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    },\n"
        "    \"recommendations\": {\n"
        "      \"title\": \"<Dynamic title>\",\n"
        "      \"summary\": \"<Summary matching Staff Engineer persona>\",\n"
        "      \"executive_takeaway\": \"...\",\n"
        "      \"positive_findings\": [...],\n"
        "      \"negative_findings\": [...],\n"
        "      \"technical_observations\": [...],\n"
        "      \"business_implications\": [...],\n"
        "      \"deployment_readiness\": \"...\",\n"
        "      \"recommended_actions\": [...],\n"
        "      \"citations\": [...],\n"
        "      \"confidence\": \"...\",\n"
        "      \"priority\": \"high\"|\"medium\"|\"low\"\n"
        "    }\n"
        "  }\n"
        "}"
    )
    return Task(
        description=user_text,
        expected_output="Single JSON object only — no other text",
        agent=agent,
    )
