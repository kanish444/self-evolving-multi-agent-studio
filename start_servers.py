import os
import sys
import subprocess
import threading
import time
import signal

def stream_output(process, prefix):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            print(f"[{prefix}] {line.strip()}", flush=True)
    except Exception:
        pass

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    print("=" * 60)
    print("   Starting SE-MAESTRO (FastAPI Backend + Vite Frontend)")
    print("=" * 60)

    # 1. Start Backend
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    print(f"Starting Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # 2. Start Frontend
    npx_cmd = "npx.cmd" if os.name == "nt" else "npx"
    frontend_cmd = [npx_cmd, "vite", "--host", "127.0.0.1", "--port", "5173"]
    print(f"Starting Frontend on http://127.0.0.1:5173 ...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Spawn reader threads
    t_backend = threading.Thread(target=stream_output, args=(backend_proc, "BACKEND"), daemon=True)
    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc, "FRONTEND"), daemon=True)
    t_backend.start()
    t_frontend.start()

    time.sleep(2)

    print("\n" + "=" * 60)
    print("   SE-MAESTRO is running on localhost!")
    print("   Studio Frontend : http://127.0.0.1:5173/")
    print("   Backend API Docs: http://127.0.0.1:8000/docs")
    print("   Health Check    : http://127.0.0.1:8000/api/health")
    print("=" * 60 + "\n")

    def cleanup(signum=None, frame=None):
        print("\nStopping SE-MAESTRO servers...")
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        try:
            backend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            # Check if any process terminated unexpectedly
            b_poll = backend_proc.poll()
            f_poll = frontend_proc.poll()
            if b_poll is not None:
                print(f"[ERROR] Backend exited unexpectedly with code {b_poll}")
                break
            if f_poll is not None:
                print(f"[ERROR] Frontend exited unexpectedly with code {f_poll}")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
