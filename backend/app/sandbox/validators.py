import os
from typing import List

MAX_FILE_SIZE_BYTES = 500 * 1024  # 500 KB
MAX_TOTAL_FILES = 20
ALLOWED_EXTENSIONS = {".py", ".js", ".json", ".java", ".class", ".txt", ".md"}

def validate_filepath(path: str) -> bool:
    """
    Prevents path traversal attacks.
    Rejects absolute references or directory parent indicators.
    """
    cleaned = path.replace("\\", "/")
    
    # Block path traversal keywords
    if "../" in cleaned or "..\\" in cleaned or cleaned.startswith("/") or ":" in cleaned:
        return False
        
    # Block system directories
    for bad in ["etc/", "var/", "bin/", "usr/", "windows/", "system32/"]:
        if bad in cleaned.lower():
            return False
            
    # Allow only relative clean filenames
    return True

def validate_execution_files(files: List[dict]) -> bool:
    """
    Asserts that the file structures comply with sandbox safety limits
    """
    if len(files) > MAX_TOTAL_FILES:
        return False
        
    for f in files:
        path = f.get("path", "")
        content = f.get("content", "")
        
        # Check path safety
        if not validate_filepath(path):
            return False
            
        # Check extension safety
        _, ext = os.path.splitext(path.lower())
        if ext not in ALLOWED_EXTENSIONS:
            return False
            
        # Check size constraints
        if len(content.encode("utf-8")) > MAX_FILE_SIZE_BYTES:
            return False
            
    return True
