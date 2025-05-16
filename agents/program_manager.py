from agents.openai_agent import OpenAIAgent
from typing import List, Dict, Any, Optional
import json

class ProgramManager(OpenAIAgent):
    """Agent responsible for managing the team and orchestrating tasks"""
    
    def __init__(self):
        super().__init__("ProgramManager", "Project Manager & Team Lead")
        self.project_tasks = []
        self.team_performance = {}
        
    def system_prompt(self) -> str:
        """PM-specific system prompt"""
        base_prompt = super().system_prompt()
        pm_prompt = f"""
{base_prompt}

As a Project Manager & Team Lead, you excel at:
1. Breaking down complex projects into manageable tasks
2. Assigning tasks to the appropriate team members based on their skills
3. Tracking project progress and identifying bottlenecks
4. Managing dependencies between tasks
5. Questioning approaches to find optimal solutions
6. Keeping projects on schedule
7. Facilitating communication between team members

Your role is to coordinate the team, ensure high quality output, and keep the project on track.
You should regularly question approaches to ensure the team is using the best possible solutions.
"""
        return pm_prompt
    
    async def create_project_plan(self, project_description: str) -> Dict[str, Any]:
        """Create a project plan based on a description"""
        prompt = f"""
I need to create a project plan for the following project:

{project_description}

Please provide a structured project plan with:
1. A list of main tasks and subtasks
2. Suggested team member assignments based on specialties
3. Estimated timeline and dependencies
4. Potential risks and mitigation strategies

Break this down into concrete, actionable items that can be assigned to team members.
"""
        response = await self.process_message(prompt)
        self.logger.info("Created project plan")
        
        # Additional step to convert the response to a structured format
        structure_prompt = f"""
Please convert the project plan into a structured JSON format with the following shape:
{{
  "project_name": "Name of the project",
  "tasks": [
    {{
      "id": "task-1",
      "title": "Task title",
      "description": "Detailed description",
      "assignee": "Suggested team member name",
      "estimated_hours": 4,
      "dependencies": []
    }},
    ...
  ],
  "timeline": {{"start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"}},
  "risks": [
    {{"risk": "Description of risk", "mitigation": "Mitigation strategy"}}
  ]
}}

Base this structured format on the project plan I just provided: {response}
"""
        structured_response = await self.process_message(structure_prompt)
        
        try:
            # Attempt to parse as JSON
            structured_plan = json.loads(structured_response)
            return structured_plan
        except json.JSONDecodeError:
            self.logger.error("Failed to parse project plan as JSON")
            # Return a simplified version if JSON parsing fails
            return {
                "project_name": "Project",
                "tasks": [],
                "raw_plan": response
            }
    
    async def review_solution(self, task_description: str, proposed_solution: str) -> str:
        """Review a proposed solution and suggest improvements"""
        review_prompt = f"""
Task Description:
{task_description}

Proposed Solution:
{proposed_solution}

Please review this solution thoroughly and consider:
1. Is this the optimal approach?
2. Are there better alternatives?
3. Are there any edge cases not being handled?
4. Could performance be improved?
5. Is the code maintainable and following best practices?

Provide constructive feedback and specific suggestions for improvement.
"""
        return await self.process_message(review_prompt)
    
    async def summarize_progress(self, completed_tasks: List[Dict[str, Any]], 
                               pending_tasks: List[Dict[str, Any]]) -> str:
        """Generate a progress summary"""
        completed_count = len(completed_tasks)
        pending_count = len(pending_tasks)
        total_count = completed_count + pending_count
        
        if total_count == 0:
            progress_percentage = 0
        else:
            progress_percentage = (completed_count / total_count) * 100
            
        completed_task_str = "\n".join([f"- {task['title']}" for task in completed_tasks[:5]])
        if len(completed_tasks) > 5:
            completed_task_str += f"\n- ... and {len(completed_tasks) - 5} more"
            
        pending_task_str = "\n".join([f"- {task['title']}" for task in pending_tasks[:5]])
        if len(pending_tasks) > 5:
            pending_task_str += f"\n- ... and {len(pending_tasks) - 5} more"
        
        progress_prompt = f"""
Current Project Progress Summary:

Progress: {progress_percentage:.1f}% complete ({completed_count}/{total_count} tasks)

Recently Completed Tasks:
{completed_task_str}

Upcoming/Pending Tasks:
{pending_task_str}

Please provide a concise project status update based on this information. Include:
1. Overall assessment of the project status
2. Any potential bottlenecks or risks
3. Recommendations for next steps
4. Areas where we might need to adjust our approach
"""
        return await self.process_message(progress_prompt) 