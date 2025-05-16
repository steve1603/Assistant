#!/usr/bin/env python3
"""
This script checks and fixes OpenAI compatibility issues.
Run it before starting the main application.
"""

import sys
import importlib.metadata
import subprocess
import pkg_resources

def check_dependencies():
    """Check and fix key dependencies"""
    print("Checking dependencies...")
    
    # Check OpenAI version
    try:
        openai_version = importlib.metadata.version("openai")
        print(f"OpenAI library version: {openai_version}")
        
        # Parse version
        parts = openai_version.split('.')
        major_version = int(parts[0]) if parts else 0
        
        if major_version > 0:
            # OpenAI v1+ is installed, handle differently
            print("Using modern OpenAI client (v1+)")
            
            # Make sure we have required dependencies
            required_packages = [
                "openai>=1.0.0", 
                "anthropic",
                "python-dotenv",
                "flask",
                "pydantic",
                "colorlog",
                "tenacity",
                "tabulate"
            ]
            
            # Perform installation/upgrade
            cmd = [sys.executable, "-m", "pip", "install"] + required_packages
            print(f"Running: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)
            
            # Patch the api_clients.py file
            patch_api_clients()
        else:
            # For older versions, downgrade to ensure compatibility
            print("Using legacy OpenAI client (v0.x)")
            cmd = [sys.executable, "-m", "pip", "install", "openai==0.28.1"]
            print(f"Running: {' '.join(cmd)}")
            subprocess.run(cmd, check=True)
            
            # Patch differently for older version
            patch_api_clients_legacy()
        
    except (importlib.metadata.PackageNotFoundError, pkg_resources.DistributionNotFound):
        print("OpenAI library not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "openai==0.28.1"])
        patch_api_clients_legacy()
    
    print("Dependency check complete!")

def patch_api_clients():
    """Patch the api_clients.py file for modern OpenAI"""
    try:
        with open("agents/api_clients.py", "r") as f:
            content = f.read()
        
        if "self.client = openai.OpenAI(api_key=OPENAI_API_KEY)" in content:
            print("Patching api_clients.py for modern OpenAI...")
            content = content.replace(
                "self.client = openai.OpenAI(api_key=OPENAI_API_KEY)",
                "openai.api_key = OPENAI_API_KEY\n        self.client = openai.OpenAI()"
            )
            
            with open("agents/api_clients.py", "w") as f:
                f.write(content)
            print("Successfully patched api_clients.py")
    except Exception as e:
        print(f"Error patching api_clients.py: {str(e)}")

def patch_api_clients_legacy():
    """Patch the api_clients.py file for legacy OpenAI"""
    try:
        with open("agents/api_clients.py", "r") as f:
            content = f.read()
        
        if "self.client = openai.OpenAI(api_key=OPENAI_API_KEY)" in content:
            print("Patching api_clients.py for legacy OpenAI...")
            content = content.replace(
                "self.client = openai.OpenAI(api_key=OPENAI_API_KEY)",
                "openai.api_key = OPENAI_API_KEY\n        self.client = openai"
            )
            
            content = content.replace(
                "self.client.chat.completions.create(",
                "self.client.ChatCompletion.create("
            )
            
            with open("agents/api_clients.py", "w") as f:
                f.write(content)
            print("Successfully patched api_clients.py for legacy OpenAI")
    except Exception as e:
        print(f"Error patching api_clients.py: {str(e)}")

if __name__ == "__main__":
    print("OpenAI Compatibility Fixer")
    print("==========================")
    check_dependencies()
    print("\nReady to run the application! Use 'run_auto_project.cmd' to start.") 