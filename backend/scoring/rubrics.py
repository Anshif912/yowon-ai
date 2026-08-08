"""Project-type rubrics and scoring configuration."""

from __future__ import annotations

from typing import Any

DEFAULT_PROJECT_TYPE = "Other"

RUBRICS: dict[str, dict[str, Any]] = {
    "Backend API": {
        "standard": "API design, authentication, authorization, caching, scalability, concurrency, database design, logging, and observability",
        "focus": ["API Design", "Authentication", "Authorization", "Caching", "Scalability", "Concurrency", "Database Design", "Logging & Observability"],
        "avoid_expectations": ["UI interface", "client-side assets bundle optimization", "responsive styles"],
        "weights": {"architecture": 0.35, "security": 0.35, "reliability": 0.20, "innovation": 0.10},
    },
    "Frontend Web": {
        "standard": "Accessibility, performance, SEO, UX, state management, responsive design, component architecture, and bundle optimization",
        "focus": ["Accessibility", "Performance", "SEO", "UX", "State Management", "Responsive Design", "Component Architecture", "Bundle Optimization"],
        "avoid_expectations": ["database design", "distributed caching", "backend message queues"],
        "weights": {"architecture": 0.40, "innovation": 0.30, "reliability": 0.20, "security": 0.10},
    },
    "AI / Machine Learning": {
        "standard": "Model architecture, training pipeline, inference optimization, ML testing, experiment tracking, reproducibility, and responsible AI",
        "focus": ["Model Architecture", "Training Pipeline", "Inference Optimization", "ML Testing", "Experiment Tracking", "Reproducibility", "Responsible AI"],
        "avoid_expectations": ["client-side UI features", "complex user authorization models", "large dataset file storage in repo"],
        "weights": {"architecture": 0.40, "innovation": 0.30, "reliability": 0.20, "security": 0.10},
    },
    "LLM Application": {
        "standard": "Prompt engineering, prompt templates versioning, vector caching database, agent orchestration systems, and context size optimization",
        "focus": ["Prompt Templates", "Vector Store Caching", "Orchestration & Agents", "Context Window Management", "Structured Outputs Verification"],
        "avoid_expectations": ["deep neural network training", "custom GPUs hardware benchmarks"],
        "weights": {"architecture": 0.35, "innovation": 0.35, "reliability": 0.15, "security": 0.15},
    },
    "Library / SDK": {
        "standard": "Clean public API contracts, backward compatibility checks, versioning documentation, package health, and developer experience",
        "focus": ["API design", "backward compatibility", "documentation quality", "package setup and size", "types validation"],
        "avoid_expectations": ["user authorization sessions", "relational database performance metrics", "Docker container environments"],
        "weights": {"architecture": 0.45, "reliability": 0.30, "innovation": 0.15, "security": 0.10},
    },
    "CLI Tool": {
        "standard": "Terminal interface UX, arguments parsing logic, stderr handling, automated command verification, and packages distribution style",
        "focus": ["Terminal UX", "Argument parsing", "Error codes", "Documentation", "Package distribution"],
        "avoid_expectations": ["web dashboard interfaces", "OAuth2 authorization schemes", "cloud deployment pipelines"],
        "weights": {"architecture": 0.40, "reliability": 0.30, "innovation": 0.20, "security": 0.10},
    },
    "Full Stack": {
        "standard": "Decoupled server and client components, session authorizations, database caching layers, and responsive UI interfaces",
        "focus": ["API routes", "database indexing", "client-side state", "bundle optimization", "routing security"],
        "avoid_expectations": [],
        "weights": {"architecture": 0.30, "security": 0.30, "reliability": 0.25, "innovation": 0.15},
    },
    "Other": {
        "standard": "General engineering architecture quality, security baselines, and reliability measures",
        "focus": ["code organization", "dependencies health", "security controls", "error bounds"],
        "avoid_expectations": [],
        "weights": {"architecture": 0.30, "security": 0.30, "reliability": 0.25, "innovation": 0.15},
    }
}

PROJECT_TYPES = tuple(RUBRICS.keys())

GOAL_ADJUSTMENTS = {
    "Security Audit": {"security": 0.50, "architecture": 0.25, "reliability": 0.15, "innovation": 0.10},
    "Production Readiness": {"reliability": 0.40, "security": 0.30, "architecture": 0.20, "innovation": 0.10},
    "Architecture Review": {"architecture": 0.50, "reliability": 0.25, "security": 0.15, "innovation": 0.10},
    "Technical Due Diligence": {"architecture": 0.35, "reliability": 0.35, "security": 0.20, "innovation": 0.10},
    "Hackathon Evaluation": {"innovation": 0.50, "architecture": 0.25, "security": 0.15, "reliability": 0.10},
}

def is_presentation_enabled(project_type: str | None) -> bool:
    # Completely disabled for all evaluations in RC v3!
    return False

def normalize_project_type(project_type: str | None) -> str:
    cleaned = str(project_type or "").strip()
    return cleaned if cleaned in RUBRICS else DEFAULT_PROJECT_TYPE

def get_rubric(project_type: str | None, evaluation_goal: str | None = None) -> dict[str, Any]:
    norm_type = normalize_project_type(project_type)
    rubric = dict(RUBRICS[norm_type])
    
    # Adjust weights based on goal
    if evaluation_goal in GOAL_ADJUSTMENTS:
        rubric["weights"] = GOAL_ADJUSTMENTS[evaluation_goal]
        
    return {"project_type": norm_type, **rubric}

def rubric_prompt(project_type: str | None, evaluation_goal: str | None = None) -> str:
    rubric = get_rubric(project_type, evaluation_goal)
    weights = ", ".join(f"{k}={int(v * 100)}%" for k, v in rubric["weights"].items())
    avoid = ", ".join(rubric["avoid_expectations"]) or "none"
    return (
        f"PROJECT_TYPE: {rubric['project_type']}\nEVALUATION_STANDARD: {rubric['standard']}\n"
        f"FOCUS: {', '.join(rubric['focus'])}\nDO_NOT_EXPECT: {avoid}\nSCORING_WEIGHTS: {weights}\n"
        "Evaluate strictly within this engineering context. Output structured reasoning only."
    )
