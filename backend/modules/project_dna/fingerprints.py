import hashlib
import json
import re
from typing import Dict, Any, List

def canonicalize_api_paths(paths: List[str]) -> List[str]:
    """Normalizes API endpoints (e.g., /api/v1/projects/{projectId}/dna -> /api/v1/projects/{id}/dna)."""
    normalized = []
    # Replace anything inside curly braces with {id}
    id_pattern = re.compile(r'\{[^}]+\}')
    for path in paths:
        normalized.append(id_pattern.sub('{id}', path.strip().lower()))
    return sorted(list(set(normalized)))

def canonicalize_data(data: Any) -> Any:
    """Recursively normalizes data structure for deterministic hashing."""
    if isinstance(data, dict):
        # Sort keys, strip values and ignore minor counters or comments
        ignored_keys = {"created_at", "updated_at", "entropy", "raw_summary", "raw_techs", "raw_stats", "readme_length", "readme_quality", "overall_confidence"}
        return {
            k: canonicalize_data(v)
            for k, v in sorted(data.items())
            if k not in ignored_keys
        }
    elif isinstance(data, list):
        # Remove empty values, normalize strings, and sort
        normalized_list = []
        for item in data:
            if isinstance(item, str):
                normalized_list.append(item.strip().lower())
            else:
                normalized_list.append(canonicalize_data(item))
        try:
            return sorted(normalized_list)
        except TypeError:
            # Fallback if list contains uncomparable dicts/lists
            return normalized_list
    elif isinstance(data, str):
        return data.strip().lower()
    return data

def generate_dimension_hash(dimension_name: str, payload: Dict[str, Any]) -> str:
    """
    Generates a deterministic MD5 hash for a given dimension payload.
    Applies custom normalization rules depending on the dimension.
    """
    # 1. Apply dimension-specific canonicalization overrides
    canonical_payload = {}
    if dimension_name == "API" and "endpoints" in payload:
        canonical_payload = {
            "endpoints": canonicalize_api_paths(payload.get("endpoints", [])),
            "protocols": payload.get("protocols", {})
        }
    elif dimension_name == "Technology":
        canonical_payload = {
            "languages": canonicalize_data(payload.get("languages", [])),
            "frameworks": canonicalize_data(payload.get("frameworks", [])),
            "libraries": canonicalize_data(payload.get("libraries", []))
        }
    elif dimension_name == "Architecture":
        canonical_payload = {
            "architecture_pattern": payload.get("architecture_pattern", "").strip().lower(),
            "components": canonicalize_data(payload.get("components", []))
        }
    else:
        canonical_payload = canonicalize_data(payload)
        
    # 2. Serialize to deterministic JSON string
    serialized = json.dumps(canonical_payload, sort_keys=True)
    
    # 3. MD5 hash
    return hashlib.md5(serialized.encode("utf-8")).hexdigest()
