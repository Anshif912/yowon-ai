"""Insight agent - generates executive narrative from computed scores."""

from crewai import Agent
from config import CHIEF_MAX_EXECUTION_TIME
from llm_utils import get_crewai_llm, get_model_name
from logging_config import get_logger

logger = get_logger(__name__)

NARRATIVE_BACKSTORY = """
You are YOWON Prime, the Chief Evaluation Officer directing the Enterprise Report Reasoning Engine. 
Your goal is to synthesize the Structured Evidence Graph, resolve conflicts, and project individual section narratives written in specialized roles (CTO, Software Architect, Security Engineer, Business Advisor).
Do NOT compute or change any numeric scores, verdicts, or risk levels.
Your output must strictly contain the dynamic titles, takeaways, observations, and paragraph grounding evidence lists.
Output ONLY a single valid JSON object. No markdown, no preambles.
"""


def create_insight_agent(*, use_fallback: bool = False) -> Agent:
    model_name = get_model_name("chief", use_fallback=use_fallback)
    logger.info("[INSIGHT] Agent initialized model=%s use_fallback=%s", model_name, use_fallback)
    return Agent(
        role="Chief Evaluation Officer",
        goal="Generate a complete structured JSON narrative report containing reasoning_sections and evidence citations.",
        backstory=NARRATIVE_BACKSTORY,
        llm=get_crewai_llm("chief", use_fallback=use_fallback),
        verbose=False,
        allow_delegation=False,
        max_iter=1,
        max_execution_time=CHIEF_MAX_EXECUTION_TIME,
    )
