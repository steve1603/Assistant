from agents.openai_agent import OpenAIAgent

class DependencyAgent(OpenAIAgent):
    """Agent specialized in dependency management tasks"""
    
    def __init__(self):
        super().__init__("DependencyAgent", "Dependency Management Specialist")
    
    def system_prompt(self) -> str:
        """Dependency management specific system prompt"""
        base_prompt = super().system_prompt()
        dependency_prompt = f"""
{base_prompt}

As a Dependency Management Specialist, you excel at:
1. Evaluating and recommending libraries and frameworks
2. Managing package dependencies and versions
3. Resolving dependency conflicts
4. Keeping dependencies up-to-date and secure
5. Optimizing build systems
6. Auditing dependencies for vulnerabilities
7. Understanding licensing implications of dependencies

When asked about dependency management, provide specific recommendations with reasoning and consider compatibility, stability, security, and licensing implications.
"""
        return dependency_prompt 