import os

def _parse_keys():
    """OpenRouter keys with fallback support.

    Primary source: OPENROUTER_API_KEYS — comma/whitespace separated list
    (e.g. "key1,key2,key3,key4"). Legacy single OPENROUTER_API_KEY is also
    honoured and placed first. Order is preserved, duplicates removed.
    Keys are tried in order; a key that fails (401/403/429/provider error)
    falls through to the next one.
    """
    keys = []
    for raw in (os.getenv("OPENROUTER_API_KEY", ""), os.getenv("OPENROUTER_API_KEYS", "")):
        for part in raw.replace("\n", ",").split(","):
            k = part.strip()
            if k and k not in keys:
                keys.append(k)
    return keys

OPENROUTER_API_KEYS = _parse_keys()
# Backwards-compatible alias: the first key, if any.
OPENROUTER_API_KEY = OPENROUTER_API_KEYS[0] if OPENROUTER_API_KEYS else ""
GITHUB_TOKEN=os.getenv("GITHUB_TOKEN","")
DATABASE_URL=os.getenv("DATABASE_URL","sqlite:///./repopilot.db")
VISUAL_STORAGE_DIR=os.getenv("VISUAL_STORAGE_DIR","./data/visual")
OPENROUTER_BASE="https://openrouter.ai/api/v1"
MODELS=["google/gemma-4-31b-it:free","google/gemma-4-26b-a4b-it:free"]
MAX_IMAGE_BYTES=10*1024*1024
MAX_FILE_BYTES=200_000
