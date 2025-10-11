import sys
import os

# Filter out WindowsApps paths from sys.path
original_sys_path = list(sys.path)
sys.path = [p for p in original_sys_path if "WindowsApps" not in p]

print("Python executable:", sys.executable)
print("Filtered sys.path:", sys.path)
try:
    import google.generativeai as genai
    print("Successfully imported google.generativeai")
except ModuleNotFoundError as e:
    print(f"ModuleNotFoundError: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# Restore original sys.path if needed for other operations (though not strictly necessary for this debug)
sys.path = original_sys_path