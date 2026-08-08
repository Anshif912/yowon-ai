import json
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from llm_utils import invoke_direct_llm, get_model_name
from agents.atlas_agent import AtlasFactsheet

logger = logging.getLogger(__name__)

class SpecialistInitialEvaluation(BaseModel):
    initial_score: int = Field(ge=0, le=100)
    engineering_confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    evidence_confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    reasoning_completeness: float = Field(default=0.8, ge=0.0, le=1.0)
    contradiction_score: float = Field(default=0.0, ge=0.0, le=1.0)
    evidence_coverage: float = Field(default=0.7, ge=0.0, le=1.0)
    repository_coverage: float = Field(default=0.7, ge=0.0, le=1.0)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class Criticism(BaseModel):
    author: str
    target: str
    category: str
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    confidence: float = 0.8
    repository_evidence: str
    repository_paths: List[str] = Field(default_factory=list)
    rule_ids: List[str] = Field(default_factory=list)
    status: str = "Pending"  # Pending | Accepted | Rejected | Partially Accepted | Requires Review
    rebuttal: Optional[str] = None

class DebateRound(BaseModel):
    round_number: int
    criticisms: List[Criticism] = Field(default_factory=list)

class DebateSession(BaseModel):
    initial_evaluations: Dict[str, SpecialistInitialEvaluation] = Field(default_factory=dict)
    rounds: List[DebateRound] = Field(default_factory=list)
    skipped: bool = False

class DebateEngine:
    def __init__(self, project_id: str, factsheet: AtlasFactsheet, rubric_prompt_text: str):
        self.project_id = project_id
        self.factsheet = factsheet
        self.rubric_prompt_text = rubric_prompt_text
        self.model_name = get_model_name("specialist")

    def run_initial_evaluations(self) -> Dict[str, SpecialistInitialEvaluation]:
        evals: Dict[str, SpecialistInitialEvaluation] = {}
        agents = {
            "Forge": "You are Forge, the Principal Software Architect. Focus on structure, design patterns, modularity, AST complexity.",
            "Sentinel": "You are Sentinel, the Application Security Auditor. Focus on vulnerabilities, secrets exposure, dependency CVEs.",
            "Guardian": "You are Guardian, the Deployment Reliability Analyst. Focus on concurrency limits, pool sizes, exception bounds.",
            "Visionary": "You are Visionary, the Innovation Scoring Agent. Focus on framework adaptations, tech novelty index."
        }

        factsheet_json = self.factsheet.model_dump_json(indent=2)

        for name, role in agents.items():
            prompt = (
                f"{role}\n"
                f"RUBRIC DETAILS:\n{self.rubric_prompt_text}\n\n"
                f"FACTUAL REPOSITORY EVIDENCE (Atlas):\n{factsheet_json}\n\n"
                f"Perform your initial evaluation of this codebase.\n"
                f"You MUST return a JSON matching this structure exactly:\n"
                f"{{\n"
                f"  \"initial_score\": 82,\n"
                f"  \"engineering_confidence\": 0.95,\n"
                f"  \"evidence_confidence\": 0.9,\n"
                f"  \"reasoning_completeness\": 0.85,\n"
                f"  \"contradiction_score\": 0.1,\n"
                f"  \"evidence_coverage\": 0.8,\n"
                f"  \"repository_coverage\": 0.75,\n"
                f"  \"strengths\": [\"Clean service layers\", \"No raw secrets\"],\n"
                f"  \"weaknesses\": [\"Unused packages\", \"Modularity bypasses\"],\n"
                f"  \"assumptions\": [\"Production deployment target\"],\n"
                f"  \"citations\": [\"routers/auth.py\", \"requirements.txt\"],\n"
                f"  \"recommendations\": [\"Refactor middleware dependencies\"]\n"
                f"}}\n"
                f"Ensure output is valid JSON inside ```json ... ``` blocks."
            )

            try:
                response = invoke_direct_llm(self.model_name, prompt)
                from validation.json_utils import extract_json
                raw_json = extract_json(response)
                evals[name] = SpecialistInitialEvaluation(**raw_json)
            except Exception as e:
                logger.warning("Agent %s initial evaluation failed: %s. Using safe defaults.", name, e)
                evals[name] = SpecialistInitialEvaluation(
                    initial_score=75,
                    strengths=["Default fallback metrics applied"],
                    weaknesses=["Incomplete parsing results"],
                    recommendations=["Re-run evaluation run"]
                )

        return evals

    def run_debate(self, initial_evals: Dict[str, SpecialistInitialEvaluation]) -> DebateSession:
        scores = [e.initial_score for e in initial_evals.values()]
        
        # Debate Quality Filter: If agents agree within a 5% margin, skip the debate round
        if max(scores) - min(scores) <= 5:
            logger.info("[DebateEngine] Skip debate: Specialist initial scores converge within 5%% (%s)", scores)
            return DebateSession(initial_evaluations=initial_evals, rounds=[], skipped=True)

        session = DebateSession(initial_evaluations=initial_evals, rounds=[], skipped=False)
        factsheet_json = self.factsheet.model_dump_json(indent=2)

        for round_idx in range(1, 4):  # Up to 3 debate rounds
            logger.info("[DebateEngine] Initiating Debate Round %d", round_idx)
            round_criticisms: List[Criticism] = []

            # Forge critiques Sentinel/Guardian
            # Sentinel critiques Forge/Guardian
            # Guardian critiques Forge/Sentinel
            # Visionary critiques everyone
            for author in ["Forge", "Sentinel", "Guardian", "Visionary"]:
                targets = [t for t in initial_evals.keys() if t != author]
                for target in targets:
                    author_eval = initial_evals[author]
                    target_eval = initial_evals[target]

                    # Formulate structured criticism
                    prompt = (
                        f"You are {author}. Review the evaluation of {target}.\n"
                        f"{author} Initial Score: {author_eval.initial_score}\n"
                        f"{target} Initial Score: {target_eval.initial_score}\n"
                        f"{target} Strengths: {target_eval.strengths}\n"
                        f"{target} Weaknesses: {target_eval.weaknesses}\n\n"
                        f"FACTUAL REPOSITORY EVIDENCE (Atlas):\n{factsheet_json}\n\n"
                        f"Critique {target}'s findings if they contradict your domain or ignore evidence.\n"
                        f"Citations and repository_paths MUST reference actual files in the repository tree.\n"
                        f"Return a JSON list of criticisms matching this structure exactly:\n"
                        f"[\n"
                        f"  {{\n"
                        f"    \"author\": \"{author}\",\n"
                        f"    \"target\": \"{target}\",\n"
                        f"    \"category\": \"Security\",\n"
                        f"    \"severity\": \"MEDIUM\",\n"
                        f"    \"confidence\": 0.85,\n"
                        f"    \"repository_evidence\": \"Authentication middleware bypasses dependency inversion.\",\n"
                        f"    \"repository_paths\": [\"routers/auth.py\"],\n"
                        f"    \"rule_ids\": [\"SEC-014\"]\n"
                        f"  }}\n"
                        f"]\n"
                        f"Output valid JSON inside ```json ... ``` blocks."
                    )

                    try:
                        response = invoke_direct_llm(self.model_name, prompt)
                        from validation.json_utils import extract_json
                        raw_json = extract_json(response)
                        if isinstance(raw_json, list):
                            for crit_dict in raw_json:
                                crit = Criticism(**crit_dict)
                                
                                # Validate against AI Hallucination Guard: Paths must exist in Atlas tree
                                valid_paths = []
                                for p in crit.repository_paths:
                                    # Check if path is in factsheet file nodes
                                    if any(p in str(node.id) for node in self.factsheet.evidence_graph.nodes):
                                        valid_paths.append(p)
                                
                                if valid_paths:
                                    crit.repository_paths = valid_paths
                                    crit.status = "Pending"
                                    round_criticisms.append(crit)
                                else:
                                    logger.warning("[Hallucination Guard] Rejected criticism citation: %s", crit.repository_paths)
                    except Exception as e:
                        logger.warning("Debate round criticism generation failed: %s", e)

            # Resolve critiques in this round (Accepted, Rejected, Partially Accepted)
            resolved_criticisms: List[Criticism] = []
            for crit in round_criticisms:
                # Target responds to the criticism
                target_eval = initial_evals[crit.target]
                prompt = (
                    f"You are {crit.target}. Respond to this criticism from {crit.author}:\n"
                    f"Category: {crit.category}\n"
                    f"Severity: {crit.severity}\n"
                    f"Evidence: {crit.repository_evidence}\n"
                    f"Repository Paths: {crit.repository_paths}\n\n"
                    f"Do you accept this criticism (requiring score deduction) or reject/rebut it?\n"
                    f"Return a JSON matching this structure exactly:\n"
                    f"{{\n"
                    f"  \"status\": \"Accepted\",\n"
                    f"  \"rebuttal\": \"Accepted. Will reduce architecture score by penalty.\"\n"
                    f"}}\n"
                    f"Status must be one of: Accepted, Rejected, Partially Accepted, Requires Review."
                )

                try:
                    response = invoke_direct_llm(self.model_name, prompt)
                    from validation.json_utils import extract_json
                    res_json = extract_json(response)
                    crit.status = res_json.get("status", "Rejected")
                    crit.rebuttal = res_json.get("rebuttal", "Rebutted by target")
                except Exception:
                    crit.status = "Rejected"
                    crit.rebuttal = "Auto-rejected due to response timeout"
                
                resolved_criticisms.append(crit)

            session.rounds.append(DebateRound(round_number=round_idx, criticisms=resolved_criticisms))

        return session
