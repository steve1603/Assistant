import subprocess
import sys
import os

def main():
    print("Fixing OpenAI compatibility issues...")
    
    # Downgrade to version that works with the current code
    print("Downgrading OpenAI to version 0.28.1...")
    subprocess.run([sys.executable, "-m", "pip", "install", "openai==0.28.1", "--force-reinstall"], check=True)
    
    print("\nOpenAI package downgraded successfully!")
    print("\nYou can now run your project with:")
    print("run_devteam.cmd \"Project Name\" \"Project Description\" --max-iterations 100 --collaboration")

if __name__ == "__main__":
    main() 