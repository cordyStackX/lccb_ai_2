import os
import sys
import threading
import time


def delete_file_after_delay(file_path, delay=300):
    """Delete a file after specified delay (default 5 minutes = 300 seconds)."""

    def delete_task():
        time.sleep(delay)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️  Deleted temporary file: {file_path}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️  Failed to delete {file_path}: {e}", file=sys.stderr)

    thread = threading.Thread(target=delete_task, daemon=True)
    thread.start()
