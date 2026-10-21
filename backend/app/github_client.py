import re
from .http_client import make_client
from fastapi import HTTPException
GITHUB_RE=re.compile(r"^https://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?(?:[?#].*)?$")
def parse_github_url(url:str):
    m=GITHUB_RE.match((url or "").strip())
    if not m: raise ValueError("Invalid GitHub repository URL. Expected https://github.com/owner/repo")
    owner,repo=m.group(1),m.group(2)
    if owner in ("features","pricing","about") or ".." in repo: raise ValueError("Invalid GitHub repository URL")
    return owner,repo
def gh_headers(token=""):
    h={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"RepoPilot"}
    if token: h["Authorization"]=f"Bearer {token}"
    return h
def gh_get(path, token="", params=None):
    url=f"https://api.github.com{path}"
    try:
        with make_client(30) as c:
            r=c.get(url, headers=gh_headers(token), params=params)
    except httpx.HTTPError as e: raise HTTPException(502, f"GitHub API unreachable: {e}")
    if r.status_code==404: raise HTTPException(404,"Repository or resource not found on GitHub")
    if r.status_code==403: raise HTTPException(502,"GitHub API rate limit or access denied (403)")
    if r.status_code>=400: raise HTTPException(502,f"GitHub API error {r.status_code}")
    return r.json()
def gh_post(path, token, payload):
    with make_client(30) as c:
        r=c.post(f"https://api.github.com{path}", headers=gh_headers(token), json=payload)
    return r
