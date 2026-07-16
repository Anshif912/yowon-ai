import re
from typing import List, Dict, Any

class HybridKnowledgeSearch:
    def search(
        self,
        query: str,
        corpus: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Performs hybrid text matching and vector similarity calculations over corpus documents."""
        query_terms = set(re.findall(r'\w+', query.lower()))
        results = []

        for doc in corpus:
            content = doc.get("content", "").lower()
            doc_terms = set(re.findall(r'\w+', content))
            
            # 1. Keyword overlap (BM25 proxy score)
            overlap = query_terms.intersection(doc_terms)
            keyword_score = len(overlap) / max(len(query_terms), 1)

            # 2. Semantic vector proxy similarity (mock cosine score)
            vector_score = doc.get("semantic_relevance", 0.5)

            # 3. Hybrid score combinations
            hybrid_score = (keyword_score * 0.4) + (vector_score * 0.6)
            
            results.append({
                "document_id": doc.get("id"),
                "title": doc.get("title", "Untitled Document"),
                "content": doc.get("content"),
                "keyword_score": round(keyword_score, 3),
                "vector_score": round(vector_score, 3),
                "hybrid_score": round(hybrid_score, 3),
                "project_id": doc.get("project_id"),
                "file_path": doc.get("file_path")
            })

        # Sort and truncate
        ranked = sorted(results, key=lambda r: r["hybrid_score"], reverse=True)
        return ranked[:limit]
