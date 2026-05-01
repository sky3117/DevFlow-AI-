"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    claude_model: str = "claude-sonnet-4-20250514"
    claude_max_tokens: int = 4096
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"
    ai_service_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
