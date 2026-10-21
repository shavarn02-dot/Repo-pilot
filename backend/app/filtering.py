EXCLUDED_DIRS={"node_modules",".git","dist","build","vendor","__pycache__",".next","target","venv",".venv"}
BINARY_EXT={".png",".jpg",".jpeg",".gif",".webp",".ico",".pdf",".zip",".tar",".gz",".exe",".dll",".so",".dylib",".mp4",".mp3",".woff",".woff2",".ttf",".bin",".lock"}
def is_filtered(path:str, size:int=0, max_bytes:int=200000):
    parts=path.split("/")
    if any(p in EXCLUDED_DIRS for p in parts): return True
    low=path.lower()
    if any(low.endswith(e) for e in BINARY_EXT): return True
    if size and size>max_bytes and not low.endswith((".md",".txt")): return True
    if "package-lock.json" in low or "yarn.lock" in low or "poetry.lock" in low: return True
    return False
def filter_files(tree, max_bytes=200000):
    out=[]
    for item in tree:
        if item.get("type")!="blob": continue
        p=item.get("path",""); s=item.get("size",0) or 0
        if not is_filtered(p,s,max_bytes): out.append({"path":p,"size":s})
    return out
