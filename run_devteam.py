#!/usr/bin/env python3
"""
Simplified runner for DevTeam Agents - handles compatibility issues
"""
import sys
import os
import asyncio
import argparse
import traceback

def setup_environment():
    """Setup environment variables and dependencies"""
    # Add current directory to path
    if os.path.dirname(os.path.abspath(__file__)) not in sys.path:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Check for .env file
    if os.path.exists(".env"):
        print("Using existing .env file")
    elif os.path.exists("environment.env"):
        print("Copying environment.env to .env...")
        with open("environment.env", "r") as src:
            with open(".env", "w") as dst:
                dst.write(src.read())
    
    try:
        # Create dummy implementations if needed
        ensure_dummy_implementations()
        
        # Import after environment setup
        from config import LOGGER
        LOGGER.info("Environment setup complete")
    except Exception as e:
        print(f"Error during setup: {e}")
        traceback.print_exc()
        sys.exit(1)

def ensure_dummy_implementations():
    """Ensure dummy implementations exist"""
    # Check if dummy_openai.py exists, create if not
    if not os.path.exists("dummy_openai.py"):
        print("Creating dummy_openai.py...")
        with open("dummy_openai.py", "w") as f:
            f.write("""
import requests
import json
import os
from typing import List, Dict, Any

class ChatCompletionResponse:
    def __init__(self, content):
        self.choices = [
            type('Choice', (), {'message': type('Message', (), {'content': content})})
        ]

class ChatCompletion:
    @staticmethod
    def create(model, messages, max_tokens=1000, temperature=0.7):
        api_key = os.environ.get("OPENAI_API_KEY")
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        data = {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": temperature}
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        if response.status_code != 200:
            return ChatCompletionResponse(f"API Error: {response.status_code}")
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        return ChatCompletionResponse(content)

class DummyMessage:
    def __init__(self, role, content):
        self.role = role
        self.content = content

class DummyCompletions:
    def create(self, model, messages, max_tokens=1000, temperature=0.7):
        openai_messages = [{"role": m.role if hasattr(m, "role") else m["role"], 
                           "content": m.content if hasattr(m, "content") else m["content"]} 
                          for m in messages]
        return ChatCompletion.create(model, openai_messages, max_tokens, temperature)

class OpenAI:
    def __init__(self):
        self.chat = type('Chat', (), {'completions': DummyCompletions()})
""")
    
    # Check if dummy_anthropic.py exists, create if not
    if not os.path.exists("dummy_anthropic.py"):
        print("Creating dummy_anthropic.py...")
        with open("dummy_anthropic.py", "w") as f:
            f.write("""
import requests
import json
import os
from typing import List, Dict, Any

class AnthropicResponse:
    def __init__(self, content):
        self.content = [type('Content', (), {'text': content})]

class Anthropic:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.messages = Messages(self.api_key)

class Messages:
    def __init__(self, api_key):
        self.api_key = api_key
        
    def create(self, model, system, messages, max_tokens=2000, temperature=0.7):
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        data = {"model": model, "system": system, "messages": messages, 
                "max_tokens": max_tokens, "temperature": temperature}
        response = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=data)
        if response.status_code != 200:
            return AnthropicResponse("API Error")
        result = response.json()
        content = result.get("content", [{"text": "No response"}])[0]["text"]
        return AnthropicResponse(content)
""")

async def run_project(project_name, project_description, max_iterations=20, enable_collaboration=False):
    """Run the project with error handling"""
    try:
        # Import after environment setup
        from run_project_auto import ProjectAutomator
        
        print(f"Starting project: {project_name}")
        print(f"Description: {project_description}")
        print(f"Max iterations: {max_iterations}")
        print(f"Collaboration enabled: {enable_collaboration}")
        
        # Create and run the project
        automator = ProjectAutomator()
        await automator.create_and_execute_project(project_name, project_description, max_iterations)
        
        if enable_collaboration:
            await automator.cross_agent_collaboration()
            
        print("Project completed successfully!")
        return 0
    except Exception as e:
        print(f"Error running project: {e}")
        traceback.print_exc()
        return 1

def main():
    parser = argparse.ArgumentParser(description="DevTeam Agents Runner")
    parser.add_argument("name", help="Project name")
    parser.add_argument("description", nargs='+', help="Project description (can be multiple parts)")
    parser.add_argument("--max-iterations", type=int, default=20, help="Maximum iterations")
    parser.add_argument("--collaboration", action="store_true", help="Enable cross-agent collaboration")
    
    args = parser.parse_args()
    
    # Combine description parts
    description = " ".join(args.description)
    
    # Setup environment
    setup_environment()
    
    # Run the project
    return asyncio.run(run_project(args.name, description, args.max_iterations, args.collaboration))

if __name__ == "__main__":
    sys.exit(main()) 