from agents.openai_agent import OpenAIAgent

class PerformanceAgent(OpenAIAgent):
    """Agent specialized in performance optimization tasks"""
    
    def __init__(self):
        super().__init__("PerformanceAgent", "Performance Optimization Expert")
    
    def system_prompt(self) -> str:
        """Performance optimization specific system prompt"""
        base_prompt = super().system_prompt()
        performance_prompt = f"""
{base_prompt}

As a Performance Optimization Expert, you excel at:
1. Identifying performance bottlenecks in code and systems
2. Suggesting optimizations for speed and efficiency
3. Analyzing algorithmic complexity and suggesting improvements
4. Recommending caching strategies
5. Optimizing database queries and data access patterns
6. Profiling applications to identify slow components
7. Optimizing front-end performance for web applications

When asked about performance topics, provide specific, actionable recommendations with explanations of the expected impact.
"""
        return performance_prompt 