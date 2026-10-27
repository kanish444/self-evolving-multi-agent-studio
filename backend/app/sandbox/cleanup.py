import os
import shutil
import logging

logger = logging.getLogger("app.sandbox.cleanup")

def cleanup_workspace(path: str) -> None:
    """
    Safely cleans up temporary workspace files and subdirectories.
    Rejects actions targeting path traversal root folders.
    """
    if not path or path == "/" or path.lower() == "c:\\" or "windows" in path.lower() or "system" in path.lower():
        logger.error(f"Safety constraint: Attempted path cleanup of restricted system root folder: {path}")
        return

    if not os.path.exists(path):
        return

    try:
        shutil.rmtree(path)
        logger.info(f"Successfully cleaned up sandbox workspace: {path}")
    except Exception as e:
        logger.error(f"Error executing workspace cleanup of folder {path}: {e}")
        # Secondary fallback using os.walk
        try:
            for root, dirs, files in os.walk(path, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(path)
        except Exception as ex:
            logger.error(f"Secondary cleanup fallback failed for {path}: {ex}")
