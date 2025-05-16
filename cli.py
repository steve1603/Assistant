#!/usr/bin/env python3
import argparse
import asyncio
import sys
import json
import os
from typing import Dict, List, Any, Optional
from tabulate import tabulate

from dev_team import DevTeam
from config import LOGGER

class DevTeamCLI:
    """Command-line interface for interacting with the DevTeam"""
    
    def __init__(self):
        self.dev_team = DevTeam()
        self.current_project_id = None
        
    async def create_project(self, name: str, description: str) -> None:
        """Create a new project"""
        project_id = self.dev_team.create_project(name, description)
        self.current_project_id = project_id
        print(f"Project '{name}' created with ID: {project_id}")
        print("Initializing project plan...")
        plan = await self.dev_team.initialize_project_plan()
        print(f"Project plan initialized with {len(plan.get('tasks', []))} tasks")
    
    async def list_projects(self) -> None:
        """List all projects"""
        if not self.dev_team.projects:
            print("No projects found")
            return
            
        projects_data = []
        for project_id, project in self.dev_team.projects.items():
            task_count = len(project.tasks)
            completed_count = sum(1 for task in project.tasks.values() if task.status == "completed")
            
            if task_count > 0:
                progress = f"{completed_count}/{task_count} ({int(completed_count/task_count*100)}%)"
            else:
                progress = "0/0 (0%)"
                
            projects_data.append([
                project_id, 
                project.name, 
                progress,
                "Active" if project.active else "Inactive",
                "Current" if project_id == self.current_project_id else ""
            ])
            
        print(tabulate(projects_data, headers=["ID", "Name", "Progress", "Status", "Current"]))
    
    async def switch_project(self, project_id: str) -> None:
        """Switch to a different project"""
        if self.dev_team.switch_project(project_id):
            self.current_project_id = project_id
            project = self.dev_team.get_current_project()
            print(f"Switched to project: {project.name}")
        else:
            print(f"Project with ID '{project_id}' not found")
    
    async def list_tasks(self) -> None:
        """List tasks for the current project"""
        if not self.current_project_id:
            print("No project selected. Use 'switch' or 'create' first.")
            return
            
        tasks = await self.dev_team.get_available_tasks()
        
        if not tasks:
            print("No pending tasks found")
            return
            
        tasks_data = []
        for task in tasks:
            tasks_data.append([
                task["id"][:8] + "...",  # Truncate ID for display
                task["title"],
                task["assignee"],
                task["priority"]
            ])
            
        print(tabulate(tasks_data, headers=["ID", "Title", "Assignee", "Priority"]))
    
    async def execute_task(self, task_id: str) -> None:
        """Execute a specific task"""
        if not self.current_project_id:
            print("No project selected. Use 'switch' or 'create' first.")
            return
            
        print(f"Executing task {task_id}...")
        result = await self.dev_team.execute_task(task_id)
        
        print("\n" + "="*50)
        print("TASK RESULT:")
        print("="*50)
        print(result)
        print("="*50)
    
    async def query_agent(self, agent_key: str, query: str) -> None:
        """Query a specific agent"""
        print(f"Querying {agent_key} agent...")
        response = await self.dev_team.process_query(agent_key, query)
        
        print("\n" + "="*50)
        print(f"{agent_key.upper()} RESPONSE:")
        print("="*50)
        print(response)
        print("="*50)
    
    async def get_project_summary(self) -> None:
        """Get a summary of the current project"""
        if not self.current_project_id:
            print("No project selected. Use 'switch' or 'create' first.")
            return
            
        print("Generating project summary...")
        summary = await self.dev_team.generate_project_summary()
        
        print("\n" + "="*50)
        print("PROJECT SUMMARY:")
        print("="*50)
        print(summary)
        print("="*50)
    
    async def review_code(self, code_file: str, context: str = "") -> None:
        """Review code from a file"""
        if not os.path.exists(code_file):
            print(f"File not found: {code_file}")
            return
            
        try:
            with open(code_file, 'r') as f:
                code = f.read()
        except Exception as e:
            print(f"Error reading file: {str(e)}")
            return
            
        print(f"Requesting code review for {code_file}...")
        review = await self.dev_team.code_review(code, context)
        
        print("\n" + "="*50)
        print("CODE REVIEW:")
        print("="*50)
        print(review)
        print("="*50)
    
    def list_agents(self) -> None:
        """List all available agents"""
        agents = [
            ["program_manager", "Program Manager", "Project Manager & Team Lead"],
            ["coding", "Coding Agent", "Senior Software Developer"],
            ["docs", "Docs Agent", "Documentation Expert"],
            ["devops", "DevOps Agent", "DevOps Specialist"],
            ["performance", "Performance Agent", "Performance Optimization Expert"],
            ["dependency", "Dependency Agent", "Dependency Management Specialist"],
            ["localization", "Localization Agent", "Localization & Internationalization Expert"]
        ]
        
        print(tabulate(agents, headers=["Key", "Name", "Role"]))

async def main():
    """Main CLI entry point"""
    cli = DevTeamCLI()
    
    parser = argparse.ArgumentParser(description='DevTeam CLI')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Create project
    create_parser = subparsers.add_parser('create', help='Create a new project')
    create_parser.add_argument('name', help='Project name')
    create_parser.add_argument('description', help='Project description')
    
    # List projects
    subparsers.add_parser('projects', help='List all projects')
    
    # Switch project
    switch_parser = subparsers.add_parser('switch', help='Switch to a project')
    switch_parser.add_argument('project_id', help='Project ID')
    
    # List tasks
    subparsers.add_parser('tasks', help='List tasks for current project')
    
    # Execute task
    execute_parser = subparsers.add_parser('execute', help='Execute a task')
    execute_parser.add_argument('task_id', help='Task ID')
    
    # Query agent
    query_parser = subparsers.add_parser('query', help='Query an agent')
    query_parser.add_argument('agent_key', help='Agent key')
    query_parser.add_argument('query', help='Query text')
    
    # Project summary
    subparsers.add_parser('summary', help='Get project summary')
    
    # Code review
    review_parser = subparsers.add_parser('review', help='Review code')
    review_parser.add_argument('code_file', help='Path to code file')
    review_parser.add_argument('--context', help='Additional context', default='')
    
    # List agents
    subparsers.add_parser('agents', help='List all agents')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        await cli.create_project(args.name, args.description)
    elif args.command == 'projects':
        await cli.list_projects()
    elif args.command == 'switch':
        await cli.switch_project(args.project_id)
    elif args.command == 'tasks':
        await cli.list_tasks()
    elif args.command == 'execute':
        await cli.execute_task(args.task_id)
    elif args.command == 'query':
        await cli.query_agent(args.agent_key, args.query)
    elif args.command == 'summary':
        await cli.get_project_summary()
    elif args.command == 'review':
        await cli.review_code(args.code_file, args.context)
    elif args.command == 'agents':
        cli.list_agents()
    else:
        parser.print_help()

if __name__ == '__main__':
    asyncio.run(main()) 