from pathlib import Path


_PROMPT_DIR = Path(__file__).resolve().parents[1] / "python_txt_file"


def load_prompt_template() -> str:
    return (_PROMPT_DIR / "prompt.md").read_text(encoding="utf-8")


def load_system_prompt() -> str:
    sections = [
        "system.md",
        "pdf_data.md",
        "sensitive_data.md",
        "business.md",
    ]
    return "\n\n".join(
        (_PROMPT_DIR / section).read_text(encoding="utf-8").strip()
        for section in sections
    )


def load_business_prompt() -> str:
    sections = [
        "business_core.md",
        "pdf_data.md",
        "business.md",
    ]
    return "\n\n".join(
        (_PROMPT_DIR / section).read_text(encoding="utf-8").strip()
        for section in sections
    )
