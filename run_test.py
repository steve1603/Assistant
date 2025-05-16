#!/usr/bin/env python3
import asyncio
import os
import json
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def main():
    print("Testing API connections...")
    
    # Using direct API calls for a simple test
    # Test OpenAI
    print("\nTesting OpenAI API...")
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        print("Error: OPENAI_API_KEY not found in environment variables.")
        return
    
    try:
        import requests
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            "max_tokens": 100,
            "temperature": 0.7
        }
        
        print("Making request to OpenAI API...")
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            print(f"OpenAI Response: {content}")
            print("OpenAI API test successful!")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error testing OpenAI API: {str(e)}")
    
    # Test Anthropic
    print("\nTesting Anthropic API...")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        print("Error: ANTHROPIC_API_KEY not found in environment variables.")
        return
    
    try:
        import requests
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": anthropic_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        data = {
            "model": "claude-3-opus-20240229",
            "system": "You are a helpful assistant.",
            "messages": [
                {"role": "user", "content": "Say hello!"}
            ],
            "max_tokens": 100,
            "temperature": 0.7
        }
        
        print("Making request to Anthropic API...")
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            content = result["content"][0]["text"]
            print(f"Anthropic Response: {content}")
            print("Anthropic API test successful!")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error testing Anthropic API: {str(e)}")
    
    print("\nAPI tests completed.")

if __name__ == "__main__":
    asyncio.run(main()) 