import uvicorn
import sys
import os

# --- BEGIN DEFINITIVE ENVIRONMENT FIX ---
# This block fixes the module resolution for the uvicorn reloader subprocess
# by setting the PYTHONPATH environment variable. This is the most robust
# method to ensure the spawned process finds the correct site-packages.

# Construct the absolute path to the venv's site-packages
venv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'venv', 'Lib', 'site-packages'))

print(f"--- LAUNCHER: Forcing PYTHONPATH to: {venv_path}")

# Set the PYTHONPATH environment variable
os.environ['PYTHONPATH'] = venv_path

# --- END DEFINITIVE ENVIRONMENT FIX ---


if __name__ == "__main__":
    # Now, when uvicorn.run spawns a new process, that process will inherit
    # the PYTHONPATH and its Python interpreter will correctly find the modules.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)