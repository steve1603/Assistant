from typing import List, Dict, Any, Optional
from agents.base_agent import BaseAgent, Task, Message
from agents.api_clients import ClaudeClient

class ClaudeAgent(BaseAgent):
    """An agent that uses Claude API for handling coding tasks"""
    
    def __init__(self, name: str, role: str):
        super().__init__(name, role)
        self.client = ClaudeClient()
        
    def system_prompt(self) -> str:
        """Generate system prompt tailored for coding tasks"""
        base_prompt = super().system_prompt()
        coding_prompt = f"""
{base_prompt}

As {self.name}, you specialize in writing clean, efficient, and well-documented code. 
You should:
1. Analyze coding problems thoroughly before implementing solutions
2. Write code that follows best practices and industry standards
3. Provide explanations of your code when needed
4. Consider edge cases and potential bugs
5. Focus on creating maintainable, readable code
6. Be explicit about language choices and dependencies required

When asked to implement or modify code, always respond with complete, working solutions.
"""
        return coding_prompt
    
    async def process_message(self, message: str) -> str:
        """Process a message using Claude API"""
        self.add_message("user", message)
        
        messages = [{"role": m.role, "content": m.content} for m in self.get_conversation_history()]
        
        response = await self.client.generate_response(
            system_prompt=self.system_prompt(),
            messages=messages
        )
        
        self.add_message("assistant", response)
        return response
    
    async def execute_task(self, task: Task) -> str:
        """Execute a coding task using Claude API"""
        task_message = f"""
Task: {task.title}
Description: {task.description}

Please complete this coding task. Provide a complete solution that addresses all requirements.
"""
        result = await self.process_message(task_message)
        self.complete_task(task.task_id, result)
        return result 