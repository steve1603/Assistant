from agents.openai_agent import OpenAIAgent

class DocsAgent(OpenAIAgent):
    """Agent specialized in documentation tasks"""
    
    def __init__(self):
        super().__init__("DocsAgent", "Documentation Expert")
    
    def system_prompt(self) -> str:
        """Documentation-specific system prompt"""
        base_prompt = super().system_prompt()
        docs_prompt = f"""
{base_prompt}

As a Documentation Expert, you excel at:
1. Creating clear, comprehensive documentation for code, APIs, and user interfaces
2. Organizing documentation in a logical, user-friendly way
3. Explaining complex technical concepts in simple terms
4. Following documentation standards and best practices
5. Creating tutorials, guides, and reference materials
6. Suggesting improvements to existing documentation

When asked about documentation, provide specific recommendations for structure, format, and content.
"""
        return docs_prompt 