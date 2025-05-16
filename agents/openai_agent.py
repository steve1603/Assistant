from typing import List, Dict, Any, Optional
from agents.base_agent import BaseAgent, Task, Message
from agents.api_clients import OpenAIClient

class OpenAIAgent(BaseAgent):
    """An agent that uses OpenAI API for handling non-coding tasks"""
    
    def __init__(self, name: str, role: str):
        super().__init__(name, role)
        self.client = OpenAIClient()
        
    def system_prompt(self) -> str:
        """Generate system prompt tailored for non-coding tasks"""
        base_prompt = super().system_prompt()
        non_coding_prompt = f"""
{base_prompt}

As {self.name}, you specialize in {self.role} for software development projects.
You should:
1. Provide clear, concise, and accurate information
2. Consider the broader context of software development
3. Offer suggestions and best practices related to your specific domain
4. Ask clarifying questions when needed
5. Collaborate effectively with other team members

Your goal is to support the development process through your expertise in {self.role}.
"""
        return non_coding_prompt
    
    async def process_message(self, message: str) -> str:
        """Process a message using OpenAI API"""
        self.add_message("user", message)
        
        messages = [{"role": m.role, "content": m.content} for m in self.get_conversation_history()]
        
        response = await self.client.generate_response(
            system_prompt=self.system_prompt(),
            messages=messages
        )
        
        self.add_message("assistant", response)
        return response
    
    async def execute_task(self, task: Task) -> str:
        """Execute a non-coding task using OpenAI API"""
        task_message = f"""
Task: {task.title}
Description: {task.description}

Please complete this task related to {self.role}. Provide a comprehensive response that addresses all requirements.
"""
        result = await self.process_message(task_message)
        self.complete_task(task.task_id, result)
        return result 