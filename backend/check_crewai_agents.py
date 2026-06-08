"""Manual health check for CrewAI Agent initialization."""

from __future__ import annotations

from crewai import BaseLLM

from agents.narrative_agent import create_narrative_agent
from agents.specialist_agents import (
    create_innovation_agent,
    create_presentation_agent,
    create_risk_agent,
    create_security_agent,
    create_technical_agent,
)


def main() -> None:
    factories = [
        ("TECHNICAL", create_technical_agent),
        ("SECURITY", create_security_agent),
        ("INNOVATION", create_innovation_agent),
        ("PRESENTATION", create_presentation_agent),
        ("RISK", create_risk_agent),
        ("NARRATIVE", create_narrative_agent),
    ]
    for label, factory in factories:
        agent = factory()
        if not isinstance(agent.llm, BaseLLM):
            raise TypeError(f"{label} llm is {type(agent.llm).__name__}, expected BaseLLM")
        print(f"[{label}] Agent initialized model={agent.llm.model}")
    print("CREWAI_AGENT_INITIALIZATION_OK")


if __name__ == "__main__":
    main()
