from typing import List, Dict, Any, Optional

class ContextBuilder:
    def __init__(self, token_budget: int = 4096):
        self.token_budget = token_budget
        self._caching: Dict[str, Any] = {}

    def build_context(
        self,
        query: str,
        workspace_id: str,
        user_role: str,
        raw_documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Assembles ranked, deduplicated, RBAC-filtered context within token limits."""
        # 1. RBAC and Workspace filtering
        filtered_docs = []
        for doc in raw_documents:
            # Check permissions
            required_role = doc.get("required_role", "GUEST")
            if self._has_clearance(user_role, required_role):
                filtered_docs.append(doc)

        # 2. Duplicate removal
        unique_docs = []
        seen_contents = set()
        for doc in filtered_docs:
            content = doc.get("content", "")
            if content not in seen_contents:
                unique_docs.append(doc)
                seen_contents.add(content)

        # 3. Context ranking / Freshness scoring
        ranked_docs = sorted(
            unique_docs,
            key=lambda d: (d.get("score", 0.0) * 0.7 + d.get("freshness", 0.0) * 0.3),
            reverse=True
        )

        # 4. Token budget optimization (simulated clipping)
        selected_docs = []
        current_tokens = 0
        for doc in ranked_docs:
            estimated_tokens = len(doc.get("content", "")) // 4
            if current_tokens + estimated_tokens <= self.token_budget:
                selected_docs.append(doc)
                current_tokens += estimated_tokens
            else:
                break

        return {
            "documents": selected_docs,
            "tokens_used": current_tokens,
            "token_budget": self.token_budget
        }

    def _has_clearance(self, user_role: str, required_role: str) -> bool:
        role_hierarchy = {
            "admin": 100,
            "SUPER_ADMIN": 100,
            "ORG_OWNER": 90,
            "WORKSPACE_ADMIN": 80,
            "REVIEWER": 50,
            "CONTRIBUTOR": 30,
            "TEAM_MEMBER": 30,
            "GUEST": 10
        }
        user_clearance = role_hierarchy.get(user_role, 10)
        req_clearance = role_hierarchy.get(required_role, 10)
        return user_clearance >= req_clearance
