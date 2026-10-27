# Sandbox execution resource limits constraints

DEFAULT_TIMEOUT_SECONDS = 10
MAX_TIMEOUT_SECONDS = 30

# Max output size in bytes (100 KB). Program outputs larger than this are truncated
MAX_OUTPUT_BYTES = 100 * 1024

# Process limit where supported (to prevent fork bombs)
PROCESS_LIMIT = 50

# Memory limit in MB where supported
MEMORY_LIMIT_MB = 256
