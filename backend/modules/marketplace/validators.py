# Validators for Marketplace
def validate_item_type(item_type: str) -> bool:
    return item_type.lower() in ["plugin", "policy", "template", "report"]
