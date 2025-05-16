#!/usr/bin/env python3
import sys
import os
import subprocess
import argparse

def main():
    parser = argparse.ArgumentParser(description='Run DevTeam Agents')
    parser.add_argument('mode', choices=['api', 'cli'], help='Run mode: api or cli')
    parser.add_argument('args', nargs='*', help='Additional arguments to pass to the selected mode')
    
    args = parser.parse_args()
    
    if args.mode == 'api':
        print("Starting DevTeam API server...")
        subprocess.run([sys.executable, "api.py"])
    elif args.mode == 'cli':
        print("Running DevTeam CLI...")
        command = [sys.executable, "cli.py"] + args.args
        subprocess.run(command)
    else:
        parser.print_help()
        
if __name__ == '__main__':
    # Check dependencies
    try:
        import flask
        import anthropic
        import openai
        import colorlog
        import pydantic
        import tabulate
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install the required dependencies with: pip install -r requirements.txt")
        sys.exit(1)
        
    # Check for .env file
    if not os.path.exists(".env"):
        print("Warning: .env file not found. API keys must be set as environment variables.")
        
    main() 