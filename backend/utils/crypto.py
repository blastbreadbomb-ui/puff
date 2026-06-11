"""
Encryption utilities for sensitive data.

Uses AES-256-CBC for encrypting conversation content and user memories.
The encryption key is stored locally and generated on first run.
"""

import os
import base64
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from config import settings


class CryptoManager:
    """Manages encryption/decryption of sensitive data."""

    def __init__(self):
        self.key = self._load_or_create_key()

    def _load_or_create_key(self) -> bytes:
        """Load existing encryption key or create a new one."""
        key_file = Path(settings.encryption_key_file)
        key_file.parent.mkdir(parents=True, exist_ok=True)

        if key_file.exists():
            with open(key_file, "rb") as f:
                return f.read()
        else:
            # Generate a random 256-bit key
            key = os.urandom(32)
            with open(key_file, "wb") as f:
                f.write(key)
            return key

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string and return base64-encoded ciphertext."""
        if not plaintext:
            return plaintext

        # Generate a random IV
        iv = os.urandom(16)

        # Pad the plaintext
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(plaintext.encode("utf-8")) + padder.finalize()

        # Encrypt
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv))
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()

        # Return IV + ciphertext as base64
        return base64.b64encode(iv + ciphertext).decode("utf-8")

    def decrypt(self, encrypted: str) -> str:
        """Decrypt a base64-encoded ciphertext back to plaintext."""
        if not encrypted:
            return encrypted

        try:
            # Decode base64
            raw = base64.b64decode(encrypted)

            # Extract IV (first 16 bytes) and ciphertext
            iv = raw[:16]
            ciphertext = raw[16:]

            # Decrypt
            cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv))
            decryptor = cipher.decryptor()
            padded_data = decryptor.update(ciphertext) + decryptor.finalize()

            # Unpad
            unpadder = padding.PKCS7(128).unpadder()
            plaintext = unpadder.update(padded_data) + unpadder.finalize()

            return plaintext.decode("utf-8")
        except Exception:
            # If decryption fails, return the original string
            return encrypted


# Singleton instance
crypto_manager = CryptoManager()
