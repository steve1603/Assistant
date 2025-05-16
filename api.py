from flask import Flask, request, jsonify
import asyncio
import json
from typing import Dict, Any, List, Optional
import threading
import traceback

from dev_team import DevTeam
from config import LOGGER

app = Flask(__name__)
dev_team = DevTeam()

def run_async(coroutine):
    """Utility function to run coroutines from synchronous code"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(coroutine)

@app.route('/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    data = request.json
    if not data or 'name' not in data or 'description' not in data:
        return jsonify({'error': 'Missing required fields: name, description'}), 400
        
    project_id = dev_team.create_project(data['name'], data['description'])
    
    # Optionally initialize project plan in background
    if data.get('initialize_plan', False):
        threading.Thread(target=lambda: run_async(dev_team.initialize_project_plan())).start()
        
    return jsonify({'project_id': project_id, 'message': f"Project '{data['name']}' created successfully"})

@app.route('/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get project information"""
    if not dev_team.switch_project(project_id):
        return jsonify({'error': f"Project with ID '{project_id}' not found"}), 404
        
    project = dev_team.get_current_project()
    
    # Convert to JSON-serializable format
    project_data = {
        'id': project.project_id,
        'name': project.name,
        'description': project.description,
        'start_time': project.start_time,
        'active': project.active,
        'task_count': len(project.tasks)
    }
    
    return jsonify(project_data)

@app.route('/projects/<project_id>/plan', methods=['POST'])
def initialize_plan(project_id):
    """Initialize project plan"""
    if not dev_team.switch_project(project_id):
        return jsonify({'error': f"Project with ID '{project_id}' not found"}), 404
        
    try:
        plan = run_async(dev_team.initialize_project_plan())
        return jsonify({'plan': plan, 'message': "Project plan initialized successfully"})
    except Exception as e:
        LOGGER.error(f"Error initializing project plan: {str(e)}")
        return jsonify({'error': f"Failed to initialize project plan: {str(e)}"}), 500

@app.route('/projects/<project_id>/tasks', methods=['GET'])
def get_tasks(project_id):
    """Get all tasks for a project"""
    if not dev_team.switch_project(project_id):
        return jsonify({'error': f"Project with ID '{project_id}' not found"}), 404
        
    tasks = run_async(dev_team.get_available_tasks())
    return jsonify({'tasks': tasks})

@app.route('/projects/<project_id>/tasks/<task_id>/execute', methods=['POST'])
def execute_task(project_id, task_id):
    """Execute a specific task"""
    if not dev_team.switch_project(project_id):
        return jsonify({'error': f"Project with ID '{project_id}' not found"}), 404
        
    try:
        result = run_async(dev_team.execute_task(task_id))
        return jsonify({'result': result, 'message': f"Task {task_id} executed successfully"})
    except Exception as e:
        LOGGER.error(f"Error executing task: {str(e)}")
        return jsonify({'error': f"Failed to execute task: {str(e)}"}), 500

@app.route('/projects/<project_id>/summary', methods=['GET'])
def get_project_summary(project_id):
    """Get a summary of the project status"""
    if not dev_team.switch_project(project_id):
        return jsonify({'error': f"Project with ID '{project_id}' not found"}), 404
        
    try:
        summary = run_async(dev_team.generate_project_summary())
        return jsonify({'summary': summary})
    except Exception as e:
        LOGGER.error(f"Error generating project summary: {str(e)}")
        return jsonify({'error': f"Failed to generate project summary: {str(e)}"}), 500

@app.route('/agents/<agent_key>/query', methods=['POST'])
def query_agent(agent_key):
    """Query a specific agent"""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({'error': 'Missing required field: query'}), 400
        
    try:
        response = run_async(dev_team.process_query(agent_key, data['query']))
        return jsonify({'response': response})
    except Exception as e:
        LOGGER.error(f"Error querying agent {agent_key}: {str(e)}")
        return jsonify({'error': f"Failed to query agent: {str(e)}"}), 500

@app.route('/code/review', methods=['POST'])
def review_code():
    """Request a code review"""
    data = request.json
    if not data or 'code' not in data:
        return jsonify({'error': 'Missing required field: code'}), 400
        
    context = data.get('context', '')
    
    try:
        review = run_async(dev_team.code_review(data['code'], context))
        return jsonify({'review': review})
    except Exception as e:
        LOGGER.error(f"Error reviewing code: {str(e)}")
        return jsonify({'error': f"Failed to review code: {str(e)}"}), 500

@app.route('/agents', methods=['GET'])
def list_agents():
    """List all available agents"""
    agents = [
        {'key': 'program_manager', 'name': 'Program Manager', 'role': 'Project Manager & Team Lead'},
        {'key': 'coding', 'name': 'Coding Agent', 'role': 'Senior Software Developer'},
        {'key': 'docs', 'name': 'Docs Agent', 'role': 'Documentation Expert'},
        {'key': 'devops', 'name': 'DevOps Agent', 'role': 'DevOps Specialist'},
        {'key': 'performance', 'name': 'Performance Agent', 'role': 'Performance Optimization Expert'},
        {'key': 'dependency', 'name': 'Dependency Agent', 'role': 'Dependency Management Specialist'},
        {'key': 'localization', 'name': 'Localization Agent', 'role': 'Localization & Internationalization Expert'}
    ]
    
    return jsonify({'agents': agents})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'DevTeam API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 