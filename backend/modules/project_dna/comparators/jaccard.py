from typing import Set, Any

def calculate_jaccard_similarity(set_a: Set[Any], set_b: Set[Any]) -> float:
    """Calculates Jaccard overlap similarity index between two sets."""
    if not set_a and not set_b:
        return 1.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return round(intersection / max(union, 1), 4)

def calculate_dict_similarity(dict_a: dict, dict_b: dict) -> float:
    """Calculates similarity between two simple dictionary key-value configurations."""
    if not dict_a and not dict_b:
        return 1.0
    keys_a = set(dict_a.keys())
    keys_b = set(dict_b.keys())
    
    # Calculate Jaccard similarity of keys
    key_sim = calculate_jaccard_similarity(keys_a, keys_b)
    
    # Calculate exact matches for common keys
    common_keys = keys_a.intersection(keys_b)
    if not common_keys:
        return round(key_sim * 0.5, 4)
        
    matches = 0
    for k in common_keys:
        if str(dict_a[k]).strip().lower() == str(dict_b[k]).strip().lower():
            matches += 1
            
    val_sim = matches / len(common_keys)
    return round((key_sim * 0.4) + (val_sim * 0.6), 4)
