import asyncio
from typing import Dict, List, Any, Optional, Union
import json
import uuid
from pydantic import BaseModel, Field
import time
import traceback

from agents import (
    CodingAgent, DocsAgent, DevOpsAgent, PerformanceAgent, 
    DependencyAgent, LocalizationAgent, ProgramManager,
    BaseAgent, Task
)
from config import LOGGER

class ProjectStatus(BaseModel):
    """Project status information"""
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    tasks: Dict[str, Task] = {}
    start_time: float = Field(default_factory=time.time)
    active: bool = True
    team_members: List[str] = []

class DevTeam:
    """Main orchestration class for the AI agent development team"""
    
    def __init__(self):
        # Initialize all team agents
        self.program_manager = ProgramManager()
        
        # Coding team (Claude)
        self.coding_agent = CodingAgent()
        
        # Support team (OpenAI)
        self.docs_agent = DocsAgent()
        self.devops_agent = DevOpsAgent()
        self.performance_agent = PerformanceAgent()
        self.dependency_agent = DependencyAgent()
        self.localization_agent = LocalizationAgent()
        
        # Store all agents in a dictionary for easy access
        self.agents: Dict[str, BaseAgent] = {
            "program_manager": self.program_manager,
            "coding": self.coding_agent,
            "docs": self.docs_agent,
            "devops": self.devops_agent,
            "performance": self.performance_agent,
            "dependency": self.dependency_agent,
            "localization": self.localization_agent
        }
        
        # Project tracking
        self.projects: Dict[str, ProjectStatus] = {}
        self.current_project_id: Optional[str] = None
        
        self.logger = LOGGER
        self.logger.info("Dev Team initialized with all agents ready")
    
    def create_project(self, name: str, description: str) -> str:
        """Create a new project"""
        project = ProjectStatus(name=name, description=description)
        self.projects[project.project_id] = project
        self.current_project_id = project.project_id
        
        self.logger.info(f"Created new project: {name} (ID: {project.project_id})")
        return project.project_id
    
    def switch_project(self, project_id: str) -> bool:
        """Switch to a different project"""
        if project_id in self.projects:
            self.current_project_id = project_id
            self.logger.info(f"Switched to project: {self.projects[project_id].name}")
            return True
        else:
            self.logger.warning(f"Project ID '{project_id}' not found")
            return False
    
    def get_current_project(self) -> Optional[ProjectStatus]:
        """Get the current project status"""
        if self.current_project_id and self.current_project_id in self.projects:
            return self.projects[self.current_project_id]
        return None
    
    async def initialize_project_plan(self) -> Dict[str, Any]:
        """Initialize a project plan for the current project"""
        project = self.get_current_project()
        if not project:
            self.logger.error("No current project selected")
            return {}
            
        self.logger.info(f"Initializing project plan for '{project.name}'")
        plan = await self.program_manager.create_project_plan(project.description)
        
        # Convert plan tasks to our task system
        for task_data in plan.get("tasks", []):
            agent_key = self._map_assignee_to_agent_key(task_data.get("assignee", ""))
            if agent_key and agent_key in self.agents:
                task = self.agents[agent_key].create_task(
                    title=task_data.get("title", "Untitled Task"),
                    description=task_data.get("description", ""),
                    priority=1
                )
                project.tasks[task.task_id] = task
                
        self.logger.info(f"Initialized project plan with {len(plan.get('tasks', []))} tasks")
        return plan
    
    def _map_assignee_to_agent_key(self, assignee: str) -> Optional[str]:
        """Map an assignee name to an agent key"""
        assignee = assignee.lower()
        
        agent_mapping = {
            "program": "program_manager",
            "project": "program_manager",
            "manager": "program_manager",
            "lead": "program_manager",
            "code": "coding",
            "develop": "coding",
            "programming": "coding",
            "doc": "docs",
            "document": "docs",
            "devops": "devops",
            "deploy": "devops",
            "ci": "devops",
            "cd": "devops",
            "perform": "performance",
            "optimize": "performance",
            "depend": "dependency",
            "package": "dependency",
            "local": "localization",
            "i18n": "localization",
            "l10n": "localization"
        }
        
        for key, value in agent_mapping.items():
            if key in assignee:
                return value
                
        # Default to coding if no match
        return "coding"
    
    async def process_query(self, agent_key: str, query: str) -> str:
        """Process a query with a specific agent"""
        if agent_key not in self.agents:
            self.logger.warning(f"Unknown agent key: {agent_key}")
            return f"Unknown agent: {agent_key}"
            
        self.logger.info(f"Processing query with {agent_key} agent")
        agent = self.agents[agent_key]
        return await agent.process_message(query)
    
    async def code_review(self, code: str, context: str = "") -> str:
        """Request a code review from the program manager"""
        self.logger.info("Requesting code review")
        task_desc = f"Code review{': ' + context if context else ''}"
        return await self.program_manager.review_solution(task_desc, code)
    
    async def generate_project_summary(self) -> str:
        """Generate a summary of the current project status"""
        project = self.get_current_project()
        if not project:
            return "No current project selected"
            
        completed_tasks = []
        pending_tasks = []
        
        for task_id, task in project.tasks.items():
            task_dict = {
                "id": task_id,
                "title": task.title,
                "description": task.description,
                "assignee": task.assigned_to
            }
            
            if task.status == "completed":
                completed_tasks.append(task_dict)
            else:
                pending_tasks.append(task_dict)
                
        return await self.program_manager.summarize_progress(completed_tasks, pending_tasks)
    
    async def execute_task(self, task_id: str) -> str:
        """Execute a specific task by its ID"""
        project = self.get_current_project()
        if not project:
            return "No current project selected"
            
        if task_id not in project.tasks:
            return f"Task ID {task_id} not found"
            
        task = project.tasks[task_id]
        agent_key = self._map_assignee_to_agent_key(task.assigned_to)
        
        if not agent_key or agent_key not in self.agents:
            return f"No suitable agent found for task assigned to {task.assigned_to}"
            
        self.logger.info(f"Executing task {task_id} with {agent_key} agent")
        agent = self.agents[agent_key]
        result = await agent.execute_task(task)
        
        # Update task status
        project.tasks[task_id].status = "completed"
        project.tasks[task_id].completed_at = time.time()
        project.tasks[task_id].result = result
        
        return result
    
    async def get_available_tasks(self) -> List[Dict[str, Any]]:
        """Get all available tasks for the current project"""
        project = self.get_current_project()
        if not project:
            return []
            
        available_tasks = []
        
        for task_id, task in project.tasks.items():
            if task.status == "pending":
                available_tasks.append({
                    "id": task_id,
                    "title": task.title,
                    "description": task.description,
                    "assignee": task.assigned_to,
                    "priority": task.priority
                })
                
        # Sort by priority (higher first)
        available_tasks.sort(key=lambda x: x["priority"], reverse=True)
        return available_tasks 