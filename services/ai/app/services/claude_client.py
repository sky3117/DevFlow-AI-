"""
Singleton Anthropic AsyncAnthropic client.
Imported by endpoint modules.
"""

from anthropic import AsyncAnthropic
from app.config import settings

# Shared async client — reuse across requests
claude_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
