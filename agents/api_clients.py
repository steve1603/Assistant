import anthropic
from typing import List, Dict, Any, Optional
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
import importlib.metadata
import os
import sys
import traceback

# Add the parent directory to path so we can import dummy implementations
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import OPENAI_API_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, OPENAI_MODEL, LOGGER, MAX_TOKENS, TEMPERATURE

class ClaudeClient:
    def __init__(self):
        # Set API key as environment variable for direct API calls
        os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
        
        try:
            # Try to import the real Anthropic library
            import anthropic
            LOGGER.info("Using standard Anthropic library")
            self.use_anthropic = True
            self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        except (ImportError, Exception) as e:
            LOGGER.warning(f"Error with standard Anthropic: {e}. Using dummy implementation.")
            self.use_anthropic = False
            # Use our dummy implementation
            from dummy_anthropic import Anthropic
            self.client = Anthropic(api_key=ANTHROPIC_API_KEY)
            
        self.model = CLAUDE_MODEL
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_response(self, system_prompt: str, messages: List[Dict[str, str]]) -> str:
        """Generate a response from Claude AI"""
        try:
            response = self.client.messages.create(
                model=self.model,
                system=system_prompt,
                messages=messages,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE
            )
            return response.content[0].text
        except Exception as e:
            LOGGER.error(f"Error calling Claude API: {str(e)}")
            LOGGER.error(traceback.format_exc())
            return f"Error generating Claude response: {str(e)}"

class OpenAIClient:
    def __init__(self):
        # Set API key as environment variable
        os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
        
        try:
            # Import and use the modern OpenAI library (v1.0.0+)
            import openai
            LOGGER.info(f"OpenAI library version: {openai.__version__}")
            
            # Create a client instance as required in v1.0.0+
            try:
                # New style with client instantiation
                self.client = openai.OpenAI(api_key=OPENAI_API_KEY)
                self.client_type = "modern"
                LOGGER.info("Successfully initialized modern OpenAI client")
            except Exception as e:
                LOGGER.warning(f"Error creating modern OpenAI client: {e}")
                # Try to use direct API calls through requests
                self.client = None
                self.client_type = "direct"
                LOGGER.info("Using direct API calls for OpenAI")
                
        except ImportError:
            # OpenAI not installed, use direct API calls
            LOGGER.warning("OpenAI library not found. Using direct API calls.")
            self.client = None
            self.client_type = "direct"
        
        self.model = OPENAI_MODEL
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_response(self, system_prompt: str, messages: List[Dict[str, str]]) -> str:
        """Generate a response from OpenAI"""
        try:
            # Format messages in OpenAI format
            openai_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                openai_messages.append({"role": role, "content": content})
            
            if self.client_type == "modern" and self.client is not None:
                # Modern API (v1.0.0+)
                try:
                    LOGGER.info("Using modern OpenAI client API")
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=openai_messages,
                        max_tokens=MAX_TOKENS,
                        temperature=TEMPERATURE
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    LOGGER.error(f"Error with modern OpenAI API: {e}")
                    # Fall back to direct API calls
                    self.client_type = "direct"
            
            # Direct API calls using requests
            if self.client_type == "direct":
                LOGGER.info("Using direct API calls for OpenAI")
                import requests
                import json
                
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": self.model,
                    "messages": openai_messages,
                    "max_tokens": MAX_TOKENS,
                    "temperature": TEMPERATURE
                }
                
                response = requests.post(url, headers=headers, json=data)
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    error_msg = f"API Error: {response.status_code} - {response.text}"
                    LOGGER.error(error_msg)
                    return f"Error: {error_msg}"
                
        except Exception as e:
            LOGGER.error(f"Error calling OpenAI API: {str(e)}")
            LOGGER.error(traceback.format_exc())
            return f"Error generating response: {str(e)}" 