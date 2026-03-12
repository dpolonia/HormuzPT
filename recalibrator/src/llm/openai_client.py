import os
from typing import Optional
import openai

class OpenAIClient:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "stub":
            raise ValueError("OPENAI_API_KEY required for OpenAIClient")
        self.client = openai.OpenAI(api_key=api_key)

    def analyze(self, prompt: str, system_prompt: Optional[str] = None, model_name: str = "gpt-4o-mini", max_tokens: int = 1000) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=model_name,
            max_tokens=max_tokens,
            temperature=0.2,
            messages=messages
        )
        return response.choices[0].message.content or ""
