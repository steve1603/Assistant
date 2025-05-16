from abc import ABC, abstractmethod
import uuid
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import traceback
import sys
import time

from config import LOGGER

class Message(BaseModel):
    role: str
    content: str

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str = "pending"
    created_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None
    assigned_to: Optional[str] = None
    priority: int = 1
    dependencies: List[str] = []
    result: Optional[str] = None

class BaseAgent(ABC):
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.agent_id = str(uuid.uuid4())
        self.conversation_history: List[Message] = []
        self.tasks: Dict[str, Task] = {}
        self.logger = LOGGER
    
    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation history"""
        self.conversation_history.append(Message(role=role, content=content))
        
    def get_conversation_history(self) -> List[Message]:
        """Get the conversation history"""
        return self.conversation_history
    
    def create_task(self, title: str, description: str, priority: int = 1, 
                    dependencies: List[str] = None) -> Task:
        """Create a new task"""
        if dependencies is None:
            dependencies = []
            
        task = Task(
            title=title,
            description=description,
            priority=priority,
            dependencies=dependencies,
            assigned_to=self.name
        )
        
        self.tasks[task.task_id] = task
        self.logger.info(f"Agent {self.name} created task: {task.title}")
        return task
    
    def complete_task(self, task_id: str, result: str) -> None:
        """Mark a task as completed"""
        if task_id in self.tasks:
            self.tasks[task_id].status = "completed"
            self.tasks[task_id].completed_at = time.time()
            self.tasks[task_id].result = result
            self.logger.info(f"Agent {self.name} completed task: {self.tasks[task_id].title}")
        else:
            self.logger.warning(f"Agent {self.name} tried to complete non-existent task ID: {task_id}")
    
    def get_pending_tasks(self) -> List[Task]:
        """Get all pending tasks assigned to this agent"""
        return [task for task in self.tasks.values() 
                if task.status == "pending" and task.assigned_to == self.name]
    
    @abstractmethod
    async def process_message(self, message: str) -> str:
        """Process a message and return a response"""
        pass
    
    @abstractmethod
    async def execute_task(self, task: Task) -> str:
        """Execute a specific task and return the result"""
        pass
    
    def system_prompt(self) -> str:
        """Generate the system prompt for this agent"""
        return f"""You are {self.name}, a specialized AI agent with the role of {self.role}.
You are part of a team of AI agents collaborating on software development projects.
Your responses should be helpful, concise, and relevant to your specific role.
"""

    def __str__(self) -> str:
        return f"{self.name} ({self.role})" 