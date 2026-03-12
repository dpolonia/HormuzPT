import os
from typing import Optional
from vertexai.generative_models import GenerativeModel
import vertexai

class VertexClient:
    def __init__(self):
        project_id = os.getenv("VERTEX_AI_PROJECT_ID")
        location = os.getenv("VERTEX_AI_LOCATION")
        
        if not project_id:
            raise ValueError("VERTEX_AI_PROJECT_ID required for VertexClient")
            
        # Initialize Vertex AI SDK
        vertexai.init(project=project_id, location=location)

    def analyze(self, prompt: str, system_prompt: Optional[str] = None, model_name: str = "gemini-1.5-flash-preview-0409", max_tokens: int = 1000) -> str:
        model = GenerativeModel(
            model_name=model_name,
            system_instruction=[system_prompt] if system_prompt else None
        )
        responses = model.generate_content(
            [prompt],
            generation_config={"max_output_tokens": max_tokens, "temperature": 0.2}
        )
        return responses.text
