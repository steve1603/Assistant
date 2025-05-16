#!/usr/bin/env python3
import asyncio
import sys
import json
import argparse
import time
from typing import Dict, List, Any

from dev_team import DevTeam
from config import LOGGER

class ProjectAutomator:
    """Automates the entire project lifecycle using all agents"""
    
    def __init__(self):
        self.dev_team = DevTeam()
        self.project_id = None
        
    async def create_and_execute_project(self, name: str, description: str, max_iterations: int = 10):
        """Create a project and automatically execute all tasks until completion"""
        print(f"Creating project: {name}")
        self.project_id = self.dev_team.create_project(name, description)
        
        print("Initializing project plan...")
        plan = await self.dev_team.initialize_project_plan()
        print(f"Project plan created with {len(plan.get('tasks', []))} tasks")
        
        # Initial project summary
        summary = await self.dev_team.generate_project_summary()
        print("\n" + "="*80)
        print("INITIAL PROJECT SUMMARY:")
        print("="*80)
        print(summary)
        print("="*80 + "\n")
        
        # Execute all tasks in order
        iteration = 0
        while iteration < max_iterations:
            tasks = await self.dev_team.get_available_tasks()
            
            if not tasks:
                print("All tasks completed!")
                break
                
            print(f"\nIteration {iteration+1}/{max_iterations}. {len(tasks)} pending tasks.")
            
            # Sort tasks by priority
            tasks.sort(key=lambda x: x.get("priority", 0), reverse=True)
            
            # Execute the highest priority task
            task = tasks[0]
            print(f"\n" + "-"*80)
            print(f"Executing task: {task['title']}")
            print(f"Assigned to: {task['assignee']}")
            print(f"Description: {task['description']}")
            print("-"*80)
            
            # Execute the task
            result = await self.dev_team.execute_task(task["id"])
            
            # Get program manager to review the result
            review = await self.dev_team.process_query("program_manager", 
                f"Please review this task result and suggest improvements or next steps:\n\nTask: {task['title']}\nResult: {result}")
            
            print("\n" + "-"*80)
            print("PROGRAM MANAGER REVIEW:")
            print("-"*80)
            print(review)
            print("-"*80)
            
            iteration += 1
            
            # Get progress summary every 3 tasks
            if iteration % 3 == 0 or not tasks:
                summary = await self.dev_team.generate_project_summary()
                print("\n" + "="*80)
                print(f"PROJECT PROGRESS SUMMARY (Iteration {iteration}):")
                print("="*80)
                print(summary)
                print("="*80 + "\n")
            
            # Small delay to prevent overwhelming output
            time.sleep(1)
        
        # Final project summary
        summary = await self.dev_team.generate_project_summary()
        print("\n" + "="*80)
        print("FINAL PROJECT SUMMARY:")
        print("="*80)
        print(summary)
        print("="*80)
        
        if iteration >= max_iterations and tasks:
            print(f"\nWARNING: Reached maximum number of iterations ({max_iterations}).")
            print(f"There are still {len(tasks)} tasks remaining.")
            
        print("\nProject automation completed!")
        
    async def cross_agent_collaboration(self):
        """Get agents to collaborate and improve each other's work"""
        if not self.project_id:
            print("No project created yet. Run create_and_execute_project first.")
            return
            
        print("\nStarting cross-agent collaboration phase...")
        
        # Get coding agent to propose a solution
        coding_query = "Please propose a code structure for this project based on the current understanding."
        coding_response = await self.dev_team.process_query("coding", coding_query)
        
        print("\n" + "-"*80)
        print("CODING AGENT PROPOSAL:")
        print("-"*80)
        print(coding_response)
        print("-"*80)
        
        # Get performance agent to review
        performance_query = f"Review this code structure proposal from a performance perspective:\n\n{coding_response}"
        performance_review = await self.dev_team.process_query("performance", performance_query)
        
        print("\n" + "-"*80)
        print("PERFORMANCE AGENT REVIEW:")
        print("-"*80)
        print(performance_review)
        print("-"*80)
        
        # Get dependency agent input
        dependency_query = f"Based on the proposed solution and performance review, what dependencies would you recommend?\n\nProposal: {coding_response}\n\nPerformance Review: {performance_review}"
        dependency_response = await self.dev_team.process_query("dependency", dependency_query)
        
        print("\n" + "-"*80)
        print("DEPENDENCY AGENT RECOMMENDATIONS:")
        print("-"*80)
        print(dependency_response)
        print("-"*80)
        
        # Get devops input
        devops_query = f"Considering the proposed solution, what deployment strategy would you recommend?\n\nProposal: {coding_response}"
        devops_response = await self.dev_team.process_query("devops", devops_query)
        
        print("\n" + "-"*80)
        print("DEVOPS AGENT RECOMMENDATIONS:")
        print("-"*80)
        print(devops_response)
        print("-"*80)
        
        # Get docs input
        docs_query = f"Based on all the input so far, outline a documentation structure for this project:\n\nCode Proposal: {coding_response}\nDependencies: {dependency_response}\nDevOps Strategy: {devops_response}"
        docs_response = await self.dev_team.process_query("docs", docs_query)
        
        print("\n" + "-"*80)
        print("DOCUMENTATION AGENT RECOMMENDATIONS:")
        print("-"*80)
        print(docs_response)
        print("-"*80)
        
        # Final synthesis from the program manager
        synthesis_query = f"""Please synthesize all the input from the team into a cohesive project plan:

Code Structure: {coding_response}

Performance Considerations: {performance_review}

Dependencies: {dependency_response}

DevOps Strategy: {devops_response}

Documentation Structure: {docs_response}

Provide a comprehensive project plan that integrates all these recommendations.
"""
        synthesis = await self.dev_team.process_query("program_manager", synthesis_query)
        
        print("\n" + "="*80)
        print("PROGRAM MANAGER SYNTHESIS:")
        print("="*80)
        print(synthesis)
        print("="*80)
        
        print("\nCross-agent collaboration completed!")

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DevTeam Project Automator')
    parser.add_argument('name', help='Project name')
    parser.add_argument('description', help='Project description')
    parser.add_argument('--max-iterations', type=int, default=20, 
                        help='Maximum number of task execution iterations')
    parser.add_argument('--collaboration', action='store_true',
                        help='Run cross-agent collaboration after task execution')
    
    args = parser.parse_args()
    
    automator = ProjectAutomator()
    await automator.create_and_execute_project(args.name, args.description, args.max_iterations)
    
    if args.collaboration:
        await automator.cross_agent_collaboration()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python run_project_auto.py \"Project Name\" \"Project Description\" [--max-iterations N] [--collaboration]")
        sys.exit(1)
        
    asyncio.run(main()) 