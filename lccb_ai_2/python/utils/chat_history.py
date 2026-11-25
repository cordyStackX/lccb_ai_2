"""Normalize client-provided chat turns before sending them to a model."""


def normalize_history(data, max_messages=12, max_chars=4000):
    raw_history = data.get("history")
    history = []
    if isinstance(raw_history, list):
        for item in raw_history[-max_messages:]:
            if not isinstance(item, dict) or item.get("role") not in {"user", "assistant"}:
                continue
            content = item.get("content")
            if not isinstance(content, str) or not content.strip():
                continue
            history.append({"role": item["role"], "content": content.strip()[-max_chars:]})

    if history:
        return history

    # Compatibility for older clients that only send the previous exchange.
    previous_user = str(data.get("last_user_response", "")).strip()
    previous_assistant = str(data.get("last_ai_response", "")).strip()
    if previous_user:
        history.append({"role": "user", "content": previous_user[-max_chars:]})
    if previous_assistant:
        history.append({"role": "assistant", "content": previous_assistant[-max_chars:]})
    return history
