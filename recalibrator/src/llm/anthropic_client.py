import os
from typing import Optional
import anthropic

class AnthropicClient:
    def __init__(self):
        # We use sync since analyst.py does not await the analyze call right now
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key == "stub":
            raise ValueError("ANTHROPIC_API_KEY required for AnthropicClient")
        self.client = anthropic.Anthropic(api_key=api_key)

    def analyze(self, prompt: str, system_prompt: Optional[str] = None, model_name: str = "claude-3-haiku-20240307", max_tokens: int = 1000) -> str:
        response = self.client.messages.create(
            model=model_name,
            max_tokens=max_tokens,
            temperature=0.2,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
