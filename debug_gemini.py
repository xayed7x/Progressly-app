import os
import google.generativeai as genai
from dotenv import load_dotenv

def run_diagnostic():
    print("--- Gemini Environment Diagnostic ---")
    try:
        # Step 1: Load environment and configure API key
        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("ERROR: GEMINI_API_KEY not found in .env file.")
            return
        genai.configure(api_key=api_key)

        # Step 2: Print the library version
        print(f"Library Version: {genai.__version__}")

        # Step 3: List all available models
        print("\nAvailable Models for this API Key:")
        print("-" * 35)
        for model in genai.list_models():
            # Check if the model supports the 'generateContent' method for chat
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name} (Supports Chat)")
            else:
                print(f"  - {model.name}")
        print("-" * 35)

    except Exception as e:
        print(f"\nAN ERROR OCCURRED: {e}")

if __name__ == "__main__":
    run_diagnostic()
