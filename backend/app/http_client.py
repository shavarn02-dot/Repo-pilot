import os, httpx
def make_client(timeout=30):
    """httpx client that honours HTTPS_PROXY explicitly.
    trust_env parsing chokes on bracketed IPv6 entries in NO_PROXY in some
    sandboxed environments, and direct egress may be unavailable there.
    Passing the proxy URL directly avoids both problems; with no proxy env
    set (normal dev machines) this is a plain direct client."""
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("https_proxy") or os.getenv("HTTP_PROXY") or os.getenv("http_proxy")
    if proxy:
        return httpx.Client(timeout=timeout, proxy=proxy)
    return httpx.Client(timeout=timeout, trust_env=False)
