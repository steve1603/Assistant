from agents.claude_agent import ClaudeAgent

class CodingAgent(ClaudeAgent):
    """Agent specialized in coding tasks"""
    
    def __init__(self):
        super().__init__("CodingAgent", "Senior Software Developer")
    
    def system_prompt(self) -> str:
        """Coding-specific system prompt"""
        base_prompt = super().system_prompt()
        coding_prompt = f"""
{base_prompt}

As a Senior Software Developer, you excel at:
1. Writing clean, efficient, and maintainable code
2. Designing robust software architectures
3. Implementing complex algorithms and data structures
4. Debugging and troubleshooting
5. Writing comprehensive unit and integration tests
6. Refactoring existing code for better performance and readability
7. Following best practices and design patterns

When asked to write or modify code, provide complete, working solutions with appropriate error handling and documentation.
"""
        return coding_prompt 