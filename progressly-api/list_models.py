#!/usr/bin/env python3
"""
Standalone script to list all available Gemini models and their supported methods.
Run with: python list_models.py
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the Google GenAI SDK
try:
    from google import genai
except ImportError:
    print("ERROR: 'google-genai' library is not installed.")
    print("Install it with: pip install google-genai")
    exit(1)

def main():
    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment variables.")
        print("Make sure your .env file contains: GEMINI_API_KEY=your_key_here")
        exit(1)
    
    print(f"✓ API Key loaded (length: {len(api_key)} characters)\n")
    
    # Initialize the client
    try:
        client = genai.Client(api_key=api_key)
        print("✓ Google GenAI Client initialized successfully\n")
    except Exception as e:
        print(f"ERROR: Failed to initialize client: {e}")
        exit(1)
    
    # List all available models
    print("=" * 80)
    print("AVAILABLE GEMINI MODELS")
    print("=" * 80)
    
    try:
        models = client.models.list()
        
        model_count = 0
        for model in models:
            model_count += 1
            print(f"\n[{model_count}] Model Name: {model.name}")
            
            # Print supported generation methods
            if hasattr(model, 'supported_generation_methods'):
                methods = model.supported_generation_methods
                print(f"    Supported Methods: {methods}")
            else:
                print("    Supported Methods: [attribute not available]")
            
            # Print additional useful attributes if available
            if hasattr(model, 'display_name'):
                print(f"    Display Name: {model.display_name}")
            
            if hasattr(model, 'description'):
                desc = model.description
                if desc and len(desc) > 100:
                    desc = desc[:100] + "..."
                print(f"    Description: {desc}")
            
            if hasattr(model, 'input_token_limit'):
                print(f"    Input Token Limit: {model.input_token_limit:,}")
            
            if hasattr(model, 'output_token_limit'):
                print(f"    Output Token Limit: {model.output_token_limit:,}")
        
        print("\n" + "=" * 80)
        print(f"TOTAL MODELS FOUND: {model_count}")
        print("=" * 80)
        
        if model_count == 0:
            print("\nWARNING: No models were returned by the API.")
            print("This could indicate an API key issue or service availability problem.")
    
    except Exception as e:
        print(f"\nERROR: Failed to list models: {e}")
        print(f"Error type: {type(e).__name__}")
        exit(1)

if __name__ == "__main__":
    main()
