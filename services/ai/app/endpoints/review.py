"""
POST /review endpoint
Accepts a PR diff and returns a structured JSON code review from Claude.
"""

import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential

from app.services.claude_client import claude_client
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Request / Response schemas ───────────────────────────────────────────────

class ReviewRequest(BaseModel):
    diff: str = Field(..., min_length=1, max_length=200_000)
    pr_title: str = Field(default="", max_length=500)
    pr_description: str = Field(default="", max_length=5000)
    repo_name: str = Field(default="", max_length=200)


class ReviewIssue(BaseModel):
    file: str
    line: int
    severity: str  # critical | high | medium | low | info
    message: str
    suggestion: str


class ReviewResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    issues: list[ReviewIssue]
    summary: str
    approved: bool


# ─── System prompt ────────────────────────────────────────────────────────────

REVIEW_SYSTEM_PROMPT = """You are an expert code reviewer with deep knowledge of software engineering best practices, security vulnerabilities, and performance optimization.

Analyze the provided git diff and return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "score": <integer 0-100>,
  "issues": [
    {
      "file": "<filename>",
      "line": <line number>,
      "severity": "<critical|high|medium|low|info>",
      "message": "<clear description of the issue>",
      "suggestion": "<specific, actionable fix suggestion>"
    }
  ],
  "summary": "<2-3 sentence overview of the code quality and key findings>",
  "approved": <true if score >= 70 and no critical issues, else false>
}

Scoring guide:
- 90-100: Excellent code, minor style notes only
- 70-89: Good code, some improvements needed
- 50-69: Acceptable but significant issues present
- 30-49: Poor quality, major issues found
- 0-29: Critical problems, do not merge

Check for: security vulnerabilities, memory leaks, race conditions, N+1 queries, missing error handling, code style, maintainability."""


# ─── Handler ──────────────────────────────────────────────────────────────────

@router.post("/review", response_model=ReviewResponse)
async def review_code(request: ReviewRequest) -> ReviewResponse:
    """
    Performs an AI code review on a GitHub PR diff.
    Returns a structured JSON review with score, issues, summary, and approval status.
    """
    logger.info(
        "Code review requested",
        extra={"repo": request.repo_name, "diff_len": len(request.diff)},
    )

    user_content = f"""Review this pull request diff:

**Repository:** {request.repo_name}
**Title:** {request.pr_title}
**Description:** {request.pr_description or "No description provided."}

**Diff:**
```diff
{request.diff}
```"""

    try:
        review_json = await _call_claude_review(user_content)
        parsed = json.loads(review_json)

        # Validate score and clamp
        parsed["score"] = max(0, min(100, int(parsed.get("score", 50))))

        # Ensure approved is consistent with score
        has_critical = any(i.get("severity") == "critical" for i in parsed.get("issues", []))
        parsed["approved"] = parsed["score"] >= 70 and not has_critical

        logger.info(
            "Review complete",
            extra={"score": parsed["score"], "issues": len(parsed.get("issues", []))},
        )
        return ReviewResponse(**parsed)

    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude response as JSON", exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI service returned invalid JSON: {e}")
    except Exception as e:
        logger.error("Review failed", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
async def _call_claude_review(user_content: str) -> str:
    """Calls Claude API with retry logic. Returns the raw response text."""
    message = await claude_client.messages.create(
        model=settings.claude_model,
        max_tokens=settings.claude_max_tokens,
        system=REVIEW_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    return message.content[0].text
