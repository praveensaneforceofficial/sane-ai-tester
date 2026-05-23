import os
import sys
import shutil
import tkinter as tk
from tkinter import messagebox, scrolledtext
import subprocess
import threading
import time
import socket

# Set working directory to the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

def load_env_file(env_path):
    """Simple .env file loader — no external dependencies needed."""
    if not os.path.exists(env_path):
        return
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

# Load environment configurations
load_env_file(os.path.join(script_dir, '.env'))

BRAIN_HOST = os.getenv('BRAIN_HOST', 'localhost')
BRAIN_PORT = int(os.getenv('BRAIN_PORT', 8000))
API_URL = os.getenv('API_URL', 'http://localhost:3000')

def get_python_executable():
    """
    When running as a PyInstaller frozen EXE, sys.executable points to
    the EXE itself — NOT python.exe. This causes it to re-launch itself.
    We detect that and find the real python.exe from PATH instead.
    """
    if getattr(sys, 'frozen', False):
        # Running inside a PyInstaller bundle — find real Python from PATH
        python = (
            os.getenv('PYTHON_PATH')          # user override via .env
            or shutil.which('python')
            or shutil.which('python3')
            or shutil.which('py')
        )
        return python or 'python'  # fallback: hope 'python' is in PATH
    return sys.executable  # Normal .pyw run — sys.executable is correct

class BrainGUIApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sane-AI Brain Engine Control Panel")
        self.root.geometry("700x520")
        self.root.configure(bg="#0f172a") # Slate 900
        self.root.resizable(True, True)

        self.server_process = None
        self.output_thread = None
        self.status_thread = None
        self.running = False
        self.closing = False

        # Apply custom style configuration
        self.setup_ui()

        # Start health check loop in the background
        self.start_health_check_loop()

    def setup_ui(self):
        # Header title
        header_frame = tk.Frame(self.root, bg="#0f172a", pady=15)
        header_frame.pack(fill=tk.X)

        title_label = tk.Label(
            header_frame, 
            text="🧠 Sane-AI Brain Engine", 
            font=("Segoe UI", 18, "bold"), 
            fg="#f8fafc", 
            bg="#0f172a"
        )
        title_label.pack(anchor=tk.W, padx=20)

        subtitle_label = tk.Label(
            header_frame, 
            text=f"AI orchestration microservice running on port {BRAIN_PORT}", 
            font=("Segoe UI", 10), 
            fg="#94a3b8", 
            bg="#0f172a"
        )
        subtitle_label.pack(anchor=tk.W, padx=20)

        # Status and Controls frame
        control_frame = tk.Frame(self.root, bg="#1e293b", bd=1, relief=tk.FLAT, pady=15, padx=20)
        control_frame.pack(fill=tk.X, padx=20, pady=5)

        # Status indicator
        self.status_label = tk.Label(
            control_frame, 
            text="STATUS: STOPPED", 
            font=("Segoe UI", 11, "bold"), 
            fg="#ef4444", 
            bg="#1e293b"
        )
        self.status_label.pack(side=tk.LEFT)

        self.info_label = tk.Label(
            control_frame, 
            text="|  Host: " + BRAIN_HOST, 
            font=("Segoe UI", 10), 
            fg="#cbd5e1", 
            bg="#1e293b"
        )
        self.info_label.pack(side=tk.LEFT, padx=10)

        # Controls Buttons
        self.stop_btn = tk.Button(
            control_frame, 
            text="Stop Server", 
            font=("Segoe UI", 10, "bold"), 
            bg="#ef4444", 
            fg="white", 
            activebackground="#dc2626", 
            activeforeground="white", 
            bd=0, 
            padx=15, 
            pady=6, 
            cursor="hand2",
            state=tk.DISABLED,
            command=self.stop_server
        )
        self.stop_btn.pack(side=tk.RIGHT, padx=5)

        self.start_btn = tk.Button(
            control_frame, 
            text="Start Server", 
            font=("Segoe UI", 10, "bold"), 
            bg="#10b981", 
            fg="white", 
            activebackground="#059669", 
            activeforeground="white", 
            bd=0, 
            padx=15, 
            pady=6, 
            cursor="hand2",
            command=self.start_server
        )
        self.start_btn.pack(side=tk.RIGHT, padx=5)

        # Log label
        log_label_frame = tk.Frame(self.root, bg="#0f172a", pady=5)
        log_label_frame.pack(fill=tk.X, padx=20)

        tk.Label(
            log_label_frame, 
            text="Console Logs & Output Terminal", 
            font=("Segoe UI", 10, "bold"), 
            fg="#cbd5e1", 
            bg="#0f172a"
        ).pack(side=tk.LEFT)

        # Scrolled Text Box for logs
        self.log_box = scrolledtext.ScrolledText(
            self.root, 
            font=("Consolas", 10), 
            bg="#030712", 
            fg="#10b981", 
            insertbackground="white", 
            state='disabled', 
            bd=0,
            highlightthickness=1,
            highlightcolor="#3b82f6"
        )
        self.log_box.pack(fill=tk.BOTH, expand=True, padx=20, pady=(5, 20))

        # Handle window exit safely
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def write_log(self, text):
        if self.closing:
            return
        self.log_box.configure(state='normal')
        self.log_box.insert(tk.END, text)
        self.log_box.see(tk.END)
        self.log_box.configure(state='disabled')

    def start_server(self):
        if self.running:
            return

        self.running = True
        self.start_btn.configure(state=tk.DISABLED, bg="#6b7280")
        self.stop_btn.configure(state=tk.NORMAL)
        self.status_label.configure(text="STATUS: STARTING...", fg="#eab308")
        self.write_log(">>> Initiating Sane-AI Brain FastAPI Server...\n")

        # Run uvicorn in subprocess, no console window
        try:
            python_exe = get_python_executable()
            cmd = [
                python_exe, "-m", "uvicorn",
                "src.main:app",
                "--host", BRAIN_HOST,
                "--port", str(BRAIN_PORT)
            ]
            self.write_log(f">>> Executing command: {' '.join(cmd)}\n")
            
            # Use CREATE_NO_WINDOW on Windows to prevent a black CMD box popping up
            creation_flags = 0
            if sys.platform == 'win32':
                creation_flags = subprocess.CREATE_NO_WINDOW

            self.server_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='ignore',
                cwd=script_dir,
                creationflags=creation_flags
            )

            # Start thread to capture process logs
            self.output_thread = threading.Thread(target=self.capture_logs, daemon=True)
            self.output_thread.start()

        except Exception as e:
            self.write_log(f"❌ Error starting server: {str(e)}\n")
            self.running = False
            self.start_btn.configure(state=tk.NORMAL, bg="#10b981")
            self.stop_btn.configure(state=tk.DISABLED)
            self.status_label.configure(text="STATUS: FAILED", fg="#ef4444")

    def capture_logs(self):
        if not self.server_process:
            return
        
        while True:
            line = self.server_process.stdout.readline()
            if not line:
                break
            self.write_log(line)
        
        # Process has ended
        rc = self.server_process.wait()
        self.write_log(f"\n>>> Server process exited with code {rc}\n")
        self.running = False
        
        # Thread safe update of controls
        self.root.after(0, self.reset_gui_stopped)

    def stop_server(self):
        if not self.running:
            return
        
        self.write_log("\n>>> Requesting Sane-AI Brain shutdown...\n")
        self.status_label.configure(text="STATUS: SHUTTING DOWN...", fg="#eab308")
        
        if self.server_process:
            try:
                # Under Windows, taskkill is cleaner to terminate process trees
                if sys.platform == 'win32':
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(self.server_process.pid)],
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                else:
                    self.server_process.terminate()
            except Exception as e:
                self.write_log(f"⚠️ Error while terminating process: {str(e)}\n")

        self.reset_gui_stopped()

    def reset_gui_stopped(self):
        self.running = False
        self.start_btn.configure(state=tk.NORMAL, bg="#10b981")
        self.stop_btn.configure(state=tk.DISABLED)
        self.status_label.configure(text="STATUS: STOPPED", fg="#ef4444")

    def start_health_check_loop(self):
        self.status_thread = threading.Thread(target=self.health_check_loop, daemon=True)
        self.status_thread.start()

    def health_check_loop(self):
        while not self.closing:
            if self.running:
                # Check if port is open
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1.0)
                try:
                    result = sock.connect_ex((BRAIN_HOST if BRAIN_HOST != '0.0.0.0' else '127.0.0.1', BRAIN_PORT))
                    if result == 0:
                        self.root.after(0, lambda: self.status_label.configure(text="STATUS: RUNNING & HEALTHY", fg="#10b981"))
                    else:
                        self.root.after(0, lambda: self.status_label.configure(text="STATUS: STARTING (Port closed)", fg="#eab308"))
                except Exception:
                    self.root.after(0, lambda: self.status_label.configure(text="STATUS: UNREACHABLE", fg="#ef4444"))
                finally:
                    sock.close()
            time.sleep(2.5)

    def on_close(self):
        if messagebox.askokcancel("Quit", "Are you sure you want to stop the Brain engine and quit?"):
            self.closing = True
            if self.running:
                self.stop_server()
            self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = BrainGUIApp(root)
    
    # Automatically start the server on GUI open as requested
    root.after(500, app.start_server)
    
    root.mainloop()
