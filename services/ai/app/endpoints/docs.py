"""
POST /docs endpoint
Accepts code and returns documented version using Claude.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential
import re

from app.services.claude_client import claude_client
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Request / Response schemas ───────────────────────────────────────────────

class DocsRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50_000)
    language: str = Field(..., min_length=1, max_length=50)
    style: str = Field(default="jsdoc", pattern="^(jsdoc|docstring|markdown)$")


class DocsResponse(BaseModel):
    docs: str
    coverage: float = Field(..., ge=0, le=100)
    functions: list[str]


# ─── System prompt ────────────────────────────────────────────────────────────

def build_docs_system_prompt(style: str, language: str) -> str:
    style_instructions = {
        "jsdoc": "Use JSDoc format with @param, @returns, @throws, @example tags.",
        "docstring": "Use Python docstring format (Google style) with Args, Returns, Raises sections.",
        "markdown": "Generate a Markdown documentation file with headers, code blocks, and parameter tables.",
    }
    instruction = style_instructions.get(style, style_instructions["jsdoc"])

    return f"""You are a technical writer expert. Generate {style} documentation for the provided {language} code.

{instruction}

Rules:
1. Return ONLY the documented version of the code (for jsdoc/docstring) or ONLY the Markdown doc (for markdown style).
2. Do not add explanations or conversational text outside the code.
3. Document every function, class, and exported constant.
4. Keep existing code logic unchanged; only add documentation comments."""


# ─── Handler ──────────────────────────────────────────────────────────────────

@router.post("/docs", response_model=DocsResponse)
async def generate_docs(request: DocsRequest) -> DocsResponse:
    """
    Generates documentation for a code snippet using Claude.
    Returns the documented code, coverage percentage, and list of documented functions.
    """
    logger.info(
        "Docs generation requested",
        extra={"language": request.language, "style": request.style, "code_len": len(request.code)},
    )

    system_prompt = build_docs_system_prompt(request.style, request.language)

    try:
        documented_code = await _call_claude_docs(
            system_prompt,
            f"Generate {request.style} documentation for this {request.language} code:\n\n{request.code}",
        )

        functions = _extract_function_names(request.code, request.language)
        coverage = _estimate_coverage(request.code, documented_code, request.language)

        logger.info(
            "Docs generated",
            extra={"functions": len(functions), "coverage": coverage},
        )

        return DocsResponse(docs=documented_code, coverage=coverage, functions=functions)

    except Exception as e:
        logger.error("Docs generation failed", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
async def _call_claude_docs(system_prompt: str, user_content: str) -> str:
    """Calls Claude API with retry logic."""
    message = await claude_client.messages.create(
        model=settings.claude_model,
        max_tokens=settings.claude_max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}],
    )
    return message.content[0].text


def _extract_function_names(code: str, language: str) -> list[str]:
    """Extracts function/method names from code using simple regex patterns."""
    patterns: dict[str, str] = {
        "javascript": r"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()",
        "typescript": r"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\(.*\)\s*(?::\s*\w+)?\s*\{)",
        "python": r"def\s+(\w+)\s*\(",
        "java": r"(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(",
        "go": r"func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(",
    }

    pattern = patterns.get(language.lower(), r"(?:function\s+(\w+)|def\s+(\w+))")
    matches = re.findall(pattern, code)
    # Flatten groups and remove empty strings
    names = [name for group in matches for name in (group if isinstance(group, tuple) else [group]) if name]
    return list(dict.fromkeys(names))  # deduplicate while preserving order


def _estimate_coverage(original: str, documented: str, language: str) -> float:
    """Estimates documentation coverage as a percentage."""
    original_funcs = _extract_function_names(original, language)
    if not original_funcs:
        return 100.0

    documented_funcs = _extract_function_names(documented, language)
    covered = sum(1 for f in original_funcs if f in documented_funcs)
    return round((covered / len(original_funcs)) * 100, 1)
