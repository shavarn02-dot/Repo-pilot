"""Multi-key OpenRouter fallback: key order parsing + rotation on failure."""
import importlib, json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class FakeResp:
    def __init__(self, status, payload=None):
        self.status_code = status
        self.headers = {"content-type": "application/json"}
        self._payload = payload or {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def json(self):
        return self._payload


class FakeClient:
    """Returns 401 for the first key, a valid completion for the second."""

    def __init__(self, timeout=None):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def post(self, url, headers=None, json=None):
        auth = (headers or {}).get("Authorization", "")
        if auth == "Bearer key-one":
            return FakeResp(401, {"error": {"message": "unauthorized"}})
        payload = {
            "choices": [{"message": {"content": json_module.dumps({"summary": "ok"})}}],
            "usage": {"total_tokens": 10},
        }
        return FakeResp(200, payload)


json_module = json


def test_key_parsing_and_fallback(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEYS", "key-one, key-two,key-three ,key-four")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    from app import config

    importlib.reload(config)
    assert config.OPENROUTER_API_KEYS == ["key-one", "key-two", "key-three", "key-four"]

    from app import openrouter

    importlib.reload(openrouter)
    assert openrouter.configured() is True
    assert openrouter.key_count() == 4

    monkeypatch.setattr(openrouter, "make_client", lambda timeout=60: FakeClient())
    result = openrouter.chat([{"role": "user", "content": "hi"}])
    assert result is not None
    assert result["key_index"] == 2  # first key 401 -> fell back to second
    assert result["json"] == {"summary": "ok"}

    # restore single/no-key state for other tests
    monkeypatch.delenv("OPENROUTER_API_KEYS", raising=False)
    importlib.reload(config)
    importlib.reload(openrouter)
