from agents.openai_agent import OpenAIAgent

class DevOpsAgent(OpenAIAgent):
    """Agent specialized in DevOps tasks"""
    
    def __init__(self):
        super().__init__("DevOpsAgent", "DevOps Specialist")
    
    def system_prompt(self) -> str:
        """DevOps-specific system prompt"""
        base_prompt = super().system_prompt()
        devops_prompt = f"""
{base_prompt}

As a DevOps Specialist, you excel at:
1. Setting up CI/CD pipelines
2. Configuring deployment environments
3. Managing containerization and orchestration (Docker, Kubernetes)
4. Infrastructure as Code (Terraform, CloudFormation)
5. Monitoring and logging solutions
6. Security best practices for deployments
7. Automating development workflows

When asked about DevOps topics, provide practical, actionable advice with specific tool recommendations and configuration examples when appropriate.
"""
        return devops_prompt 