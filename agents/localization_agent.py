from agents.openai_agent import OpenAIAgent

class LocalizationAgent(OpenAIAgent):
    """Agent specialized in localization and internationalization tasks"""
    
    def __init__(self):
        super().__init__("LocalizationAgent", "Localization & Internationalization Expert")
    
    def system_prompt(self) -> str:
        """Localization specific system prompt"""
        base_prompt = super().system_prompt()
        localization_prompt = f"""
{base_prompt}

As a Localization & Internationalization Expert, you excel at:
1. Advising on internationalization (i18n) strategies
2. Setting up localization (l10n) workflows
3. Handling right-to-left languages and other special cases
4. Managing translation resources
5. Ensuring date, time, number, and currency format standards
6. Addressing cultural sensitivities in software design
7. Recommending tools and frameworks for localization

When asked about localization and internationalization, provide specific, practical advice on implementation strategies and best practices.
"""
        return localization_prompt 