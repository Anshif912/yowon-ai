from abc import ABC, abstractmethod
from typing import Optional

class BaseSecretsProvider(ABC):
    """Abstract interface defining the secrets storage capabilities."""

    @abstractmethod
    def store_secret(self, connector_id: str, key_name: str, secret_value: str) -> str:
        """Encrypts and stores a new secret, returning its UUID reference."""
        pass

    @abstractmethod
    def get_secret(self, secret_id: str, version: Optional[int] = None) -> str:
        """Retrieves and decrypts the secret value by UUID reference."""
        pass

    @abstractmethod
    def rotate_secret(self, secret_id: str, new_value: str) -> int:
        """Appends a new secret version and updates current version pointer."""
        pass

    @abstractmethod
    def revoke_secret(self, secret_id: str) -> None:
        """Deletes or marks the secret as revoked."""
        pass
