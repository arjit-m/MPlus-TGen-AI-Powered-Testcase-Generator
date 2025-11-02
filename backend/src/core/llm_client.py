"""
Core LLM client (thin wrapper).

This module provides a single high-level function `chat(messages)` used by
agents to call an LLM provider and return assistant text. The implementation
keeps things intentionally small for Day‑1 teaching: it supports two providers
(`ollama` and `openai`) via a provider switch driven by environment
variables (loaded from `.env`).

Design goals (Day-1):
- Minimal, readable code students can extend.
- Provider-agnostic caller API: callers pass OpenAI-style `messages` and get
  back assistant text.
- Avoid advanced per-model knobs (e.g., `temperature`) to reduce student
  friction and 400/compatibility errors during demos.

Environment configuration (loaded via `python-dotenv`):
- `PROVIDER` (default: "ollama") — which provider to use. Values: "ollama" or "openai".
- `MODEL` — model id to request (e.g. `gpt-4o-mini`, `gpt-5-nano`, or `mistral:latest`).
- `OLLAMA_HOST` — base URL for local Ollama (default: `http://localhost:11434`).
- `OPENAI_API_KEY` — required when `PROVIDER=openai`.
- `LLM_TIMEOUT_S` — request timeout in seconds (default: 60).

Usage (examples):

```py
from src.core import chat

messages = [
    {"role": "system", "content": "You are a helpful QA assistant."},
    {"role": "user", "content": "Summarize the requirement"},
]
out = chat(messages)
```

The function returns the assistant's text (string). For JSON outputs the
caller should validate/parse the returned text (see `src.core.utils` helpers
for parsing and cleanup).
"""

from __future__ import annotations
import os
import json
from typing import List, Dict
import httpx
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
import logging

# module logger (agents should configure logging.basicConfig in their entrypoints)
logger = logging.getLogger(__name__)

def load_settings():
    """Load configuration from settings.json"""
    config_path = os.getenv("CONFIG_PATH")
    if not config_path or not os.path.exists(config_path):
        logger.warning("CONFIG_PATH not set or file not found, using defaults")
        return {}
        
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load settings.json: {e}")
        return {}

# Load settings from config file
settings = load_settings()

# Configuration with defaults
PROVIDER = settings.get("provider", "ollama").strip().lower()
MODEL = settings.get("model", "mistral:latest").strip()
OLLAMA_HOST = settings.get("ollamaHost", "http://localhost:11434").strip()
OPENAI_API_KEY = settings.get("openaiApiKey", "")
ANTHROPIC_API_KEY = settings.get("anthropicApiKey", "")
GOOGLE_API_KEY = settings.get("googleApiKey", "")

# Additional settings with defaults
TIMEOUT_S = 60
DISABLE_SSL_VERIFY = False
LLM_TEMPERATURE = None
LLM_LOG = settings.get("logLevel", "INFO").upper() in ("DEBUG", "INFO")
LLM_DEBUG = settings.get("logLevel", "INFO").upper() == "DEBUG"

# Debug logging
logger.info(f"Configuration loaded. Provider: {PROVIDER}, Model: {MODEL}")

Message = Dict[str, str]

def _to_lc_messages(messages: List[Message]):
    """Convert [{'role','content'}] into LangChain BaseMessages."""
    lc_msgs = []
    for m in messages:
        role = (m.get("role") or "").lower()
        content = m.get("content") or ""
        if role == "system":
            lc_msgs.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_msgs.append(AIMessage(content=content))
        else:
            # treat 'user' and anything else as human input
            lc_msgs.append(HumanMessage(content=content))
    return lc_msgs

def _make_llm():
    """
    Create the LangChain chat model according to PROVIDER/MODEL envs.

    Note: We do NOT pass a `timeout` kwarg here for maximum compatibility
    across LangChain versions/backends (e.g., ChatOllama often has no such arg).
    """
    # Create HTTP client with SSL verification disabled if needed
    http_client = None
    if DISABLE_SSL_VERIFY:
        logger.warning("SSL verification is disabled (DISABLE_SSL_VERIFY=1). Use with caution!")
        http_client = httpx.Client(verify=False)
    
    if PROVIDER == "ollama":
        # LangChain's Ollama wrapper reads OLLAMA_HOST from env.
        os.environ["OLLAMA_HOST"] = OLLAMA_HOST
        if http_client:
            return ChatOllama(model=MODEL, client=http_client)
        return ChatOllama(model=MODEL)
    elif PROVIDER == "openai":
        # Get API key from environment at runtime (not at module load)
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is missing but PROVIDER=openai.\n\n"
                "Please configure your API key in the Configuration page.\n"
                "If you don't have an OpenAI API key:\n"
                "1. Get one from https://platform.openai.com/api-keys\n"
                "2. Or switch to a different provider (Ollama, Anthropic, Google)"
            )
        # Keep temperature=0 for deterministic teaching runs
        # Explicitly pass api_key to ensure it's used
        if http_client:
            return ChatOpenAI(model=MODEL, temperature=0, api_key=api_key, http_client=http_client)
        return ChatOpenAI(model=MODEL, temperature=0, api_key=api_key)
    else:
        raise NotImplementedError(
            f"Unsupported PROVIDER='{PROVIDER}'. Use 'ollama' or 'openai'.\n"
        )

def chat(messages: List[Message], timeout: int = TIMEOUT_S) -> str:
    if not isinstance(messages, list) or not messages:
        raise ValueError("messages must be a non-empty list of {'role','content'} dicts.")

    # ---- progress: start
    if LLM_LOG:
        n_sys = sum(1 for m in messages if (m.get("role") or "").lower() == "system")
        n_usr = sum(1 for m in messages if (m.get("role") or "").lower() in ("user", "human"))
        n_ast = sum(1 for m in messages if (m.get("role") or "").lower() in ("assistant", "ai"))
        msg_count = len(messages)

        size_info = ""
        if LLM_DEBUG:
            lengths = [len(m.get("content") or "") for m in messages]
            size_info = f" | chars={sum(lengths)} total, per_msg={lengths}"

        logger.info(
            "[LLM] ▶ start provider=%s model=%s msgs=%d (sys=%d, user=%d, asst=%d)%s",
            PROVIDER,
            MODEL,
            msg_count,
            n_sys,
            n_usr,
            n_ast,
            size_info,
        )

    # ---- call model
    import time
    t0 = time.perf_counter()
    llm = _make_llm()
    lc_msgs = _to_lc_messages(messages)

    try:
        resp = llm.invoke(lc_msgs)
        out = getattr(resp, "content", "") or ""
        dt = time.perf_counter() - t0
        if LLM_LOG:
            logger.info("[LLM] ✔ done in %.2fs", dt)
        if LLM_DEBUG:
            logger.debug("[LLM] response length=%d", len(out))
        return out
    except Exception as e:
        dt = time.perf_counter() - t0
        # log exception with stacktrace
        logger.exception("[LLM] ✖ error after %.2fs: %s", dt, type(e).__name__)
        raise

logger.info("Environment variables loaded:")
for key, value in os.environ.items():
    if key.startswith("LLM") or key in ["PROVIDER", "MODEL", "OLLAMA_HOST", "OPENAI_API_KEY"]:
        logger.info(f"{key}={value}")
