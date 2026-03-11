"""Configuration — all secrets loaded from environment (.env via docker-compose)."""

import os


class Settings:
    """Application settings from environment variables."""

    def __init__(self) -> None:
        self.env: str = os.getenv("HORMUZ_ENV", "development")
        self.port: int = int(os.getenv("PORT", "8082"))

        # API keys (loaded from .env, never hardcoded)
        self.anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
        self.vertex_api_key: str = os.getenv("VERTEX_AI_API_KEY", "")
        self.huggingface_api_key: str = os.getenv("HUGGINGFACE_API_KEY", "")
        self.scopus_api_key: str = os.getenv("SCOPUS_API_KEY", "")

        # GCP
        self.gcs_bucket: str = os.getenv("GCS_BUCKET", "hormuzpt-hormuz-cache")
        self.gcp_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "hormuzpt")
        self.vertex_location: str = os.getenv("VERTEX_AI_LOCATION", "europe-west1")

        # Limits
        self.max_weekly_llm_cost: float = float(
            os.getenv("MAX_WEEKLY_LLM_COST_USD", "50")
        )

    @property
    def is_development(self) -> bool:
        return self.env == "development"


settings = Settings()
