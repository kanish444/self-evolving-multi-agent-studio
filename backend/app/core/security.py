import hashlib
import hmac
import os
import base64
import json
import time
from pathlib import Path
import secrets

# Default secret for token generation in local/dev
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not AUTH_SECRET_KEY:
    secret_path = Path(__file__).resolve().parents[2] / ".auth-secret"
    try:
        with secret_path.open("x") as stream:
            stream.write(secrets.token_urlsafe(48))
        secret_path.chmod(0o600)
    except FileExistsError:
        pass
    AUTH_SECRET_KEY = secret_path.read_text().strip()
SALT_LENGTH = 16

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(SALT_LENGTH)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    # Store salt + key in base64
    storage = salt + key
    return base64.b64encode(storage).decode("ascii")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored PBKDF2-HMAC-SHA256 hash."""
    try:
        decoded = base64.b64decode(hashed_password.encode("ascii"))
        salt = decoded[:SALT_LENGTH]
        key = decoded[SALT_LENGTH:]
        new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str, expires_in_seconds: int = 86400) -> str:
    """Generate a lightweight signed token for session authentication."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + expires_in_seconds,
        "iat": int(time.time())
    }
    
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    message = f"{b64_header}.{b64_payload}"
    signature = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).digest()
    b64_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{message}.{b64_signature}"

def decode_access_token(token: str) -> dict | None:
    """Decode and verify signed session token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        b64_header, b64_payload, b64_signature = parts
        message = f"{b64_header}.{b64_payload}"
        
        # Verify signature
        expected_signature = hmac.new(
            AUTH_SECRET_KEY.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).digest()
        actual_signature = base64.urlsafe_b64decode(b64_signature + "=" * (-len(b64_signature) % 4))
        
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
        
        payload_json = base64.urlsafe_b64decode(b64_payload + "=" * (-len(b64_payload) % 4)).decode()
        payload = json.loads(payload_json)
        
        # Check expiry
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None
