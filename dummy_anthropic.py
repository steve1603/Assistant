"""
Dummy Anthropic implementation for compatibility
"""
import requests
import json
import os
from typing import List, Dict, Any

class AnthropicResponse:
    def __init__(self, content):
        self.content = [type('Content', (), {'text': content})]

class Anthropic:
    """Simplified Anthropic client for direct API access"""
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.messages = Messages(self.api_key)

class Messages:
    def __init__(self, api_key):
        self.api_key = api_key
        
    def create(self, model, system, messages, max_tokens=2000, temperature=0.7):
        """Create a message using direct Anthropic API calls"""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        data = {
            "model": model,
            "system": system,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            error_msg = f"Anthropic API error: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
            
        result = response.json()
        content = result.get("content", [{"text": "No response"}])[0]["text"]
        
        return AnthropicResponse(content) 