# DevTeam Agents

A collaborative AI agent system for software development that includes specialized agents for different aspects of the development process.

## Features

- **Specialized AI Agents**: Each agent has expertise in a specific area of software development
  - **CodingAgent**: Expert in writing clean, efficient code (powered by Claude AI)
  - **DocsAgent**: Documentation specialist (powered by OpenAI)
  - **DevOpsAgent**: Expert in deployment, CI/CD, and infrastructure
  - **PerformanceAgent**: Focuses on optimizing performance
  - **DependencyAgent**: Manages dependencies and package selection
  - **LocalizationAgent**: Handles internationalization and localization
  - **ProgramManager**: Manages projects, reviews code, and questions approaches

- **Project Management**: Create projects, break them into tasks, and track progress
- **API and CLI Interfaces**: Interact with the system through a REST API or command-line interface
- **Code Reviews**: Get comprehensive code reviews with suggestions for improvement

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd dev-team-agents
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Configure your API keys:
   - Create a `.env` file with your OpenAI and Anthropic API keys:
```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
LOG_LEVEL=INFO
```

## Usage

### CLI

The command-line interface provides easy access to all agent capabilities:

1. **Create a project**:
```
python cli.py create "My Project" "This is a project description"
```

2. **List all projects**:
```
python cli.py projects
```

3. **Switch to a project**:
```
python cli.py switch <project-id>
```

4. **List tasks for current project**:
```
python cli.py tasks
```

5. **Execute a task**:
```
python cli.py execute <task-id>
```

6. **Query a specific agent**:
```
python cli.py query coding "How would I implement a binary search tree in Python?"
```

7. **Get project summary**:
```
python cli.py summary
```

8. **Code review**:
```
python cli.py review path/to/code.py
```

9. **List all agents**:
```
python cli.py agents
```

### API Server

1. **Start the API server**:
```
python api.py
```

2. **API Endpoints**:
   - `POST /projects`: Create a new project
   - `GET /projects/<project_id>`: Get project information
   - `POST /projects/<project_id>/plan`: Initialize project plan
   - `GET /projects/<project_id>/tasks`: Get all tasks for a project
   - `POST /projects/<project_id>/tasks/<task_id>/execute`: Execute a specific task
   - `GET /projects/<project_id>/summary`: Get a summary of the project status
   - `POST /agents/<agent_key>/query`: Query a specific agent
   - `POST /code/review`: Request a code review
   - `GET /agents`: List all available agents
   - `GET /health`: Health check endpoint

## Agent Roles

- **CodingAgent**: Writes code, solves programming problems, implements algorithms
- **DocsAgent**: Creates and reviews documentation, suggests documentation improvements
- **DevOpsAgent**: Handles infrastructure setup, CI/CD pipelines, deployment strategies
- **PerformanceAgent**: Identifies bottlenecks, suggests optimizations, improves efficiency
- **DependencyAgent**: Recommends libraries, resolves conflicts, keeps dependencies up to date
- **LocalizationAgent**: Implements internationalization, manages translations, ensures accessibility
- **ProgramManager**: Coordinates the team, ensures quality, questions approaches, creates project plans

## Architecture

The system is built with a modular design:
- Each agent inherits from a base agent class
- Claude AI powers the coding agent for superior code generation
- OpenAI powers the non-coding specialized agents
- The system supports asynchronous operations for better performance
- Project and task management is built in to track progress 