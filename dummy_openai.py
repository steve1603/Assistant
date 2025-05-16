"""
Dummy OpenAI implementation for compatibility
"""
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
        """Create a chat completion using direct API calls"""
        api_key = os.environ.get("OPENAI_API_KEY")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            data=json.dumps(data)
        )
        
        if response.status_code != 200:
            error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
            print(error_msg)
            raise Exception(error_msg)
            
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
    """Simplified OpenAI client for direct API access"""
    def __init__(self):
        self.chat = type('Chat', (), {'completions': DummyCompletions()}) 