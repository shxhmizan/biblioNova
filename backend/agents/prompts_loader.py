from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def load_prompt(name: str) -> str:
    """Load a versioned prompt file from agents/prompts/ (e.g. 'coordinator_routing.v1.md')."""
    return (_PROMPTS_DIR / name).read_text()
