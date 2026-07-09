"""
serialization.py — Centralized serialization layer for YOWON AI.
"""

import json
import dataclasses
from typing import Any, Type, TypeVar, Union
from pydantic import BaseModel

T = TypeVar("T")

def to_dict(obj: Any) -> Any:
    """
    Recursively converts an object to a pure JSON-serializable dictionary.
    Handles Pydantic models, dataclasses, lists, dicts, and primitives.
    """
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if dataclasses.is_dataclass(obj):
        return {k: to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, dict):
        return {str(k): to_dict(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [to_dict(item) for item in obj]
    return obj

def from_dict(cls: Type[T], data: Any) -> T:
    """
    Converts a dictionary or primitive back into a strongly typed Pydantic model or dataclass.
    """
    if data is None:
        return None
    
    # If the object is already of the target class, return it
    if isinstance(data, cls):
        return data

    if isinstance(cls, type) and issubclass(cls, BaseModel):
        if hasattr(cls, "model_validate"):
            return cls.model_validate(data)
        else:
            return cls.parse_obj(data)
            
    if dataclasses.is_dataclass(cls):
        if not isinstance(data, dict):
            return cls(data)
        # Filter fields to only matching ones to prevent errors
        field_names = {f.name for f in dataclasses.fields(cls)}
        filtered = {}
        for k, v in data.items():
            if k in field_names:
                # Find sub-types if any
                f_field = next(f for f in dataclasses.fields(cls) if f.name == k)
                f_type = f_field.type
                # Handle basic optional/union unpack
                if hasattr(f_type, "__args__") and len(f_type.__args__) > 0:
                    non_none = [arg for arg in f_type.__args__ if arg is not type(None)]
                    if non_none:
                        f_type = non_none[0]
                
                try:
                    if dataclasses.is_dataclass(f_type) or (isinstance(f_type, type) and issubclass(f_type, BaseModel)):
                        filtered[k] = from_dict(f_type, v)
                    else:
                        filtered[k] = v
                except Exception:
                    filtered[k] = v
        return cls(**filtered)
        
    return cls(data)

def to_json(obj: Any, indent: int = None) -> str:
    """
    Serializes an object to a JSON string using the centralized serialization dict format.
    """
    return json.dumps(to_dict(obj), indent=indent, default=str)

def from_json(cls: Type[T], json_str: str) -> T:
    """
    Deserializes a JSON string into a strongly typed object.
    """
    data = json.loads(json_str)
    return from_dict(cls, data)
