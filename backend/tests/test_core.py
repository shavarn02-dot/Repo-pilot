import os, sys, io
os.environ["DATABASE_URL"]="sqlite:///./test_repopilot.db"
os.environ.pop("OPENROUTER_API_KEY", None); os.environ.pop("GITHUB_TOKEN", None)
sys.path.insert(0, os.path.join(os.path.dirname(__file__),".."))
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.github_client import parse_github_url
from app.filtering import filter_files, is_filtered
from app.scoring import score_repository, WEIGHTS
from app.grounding import validate_grounding
from app.image_utils import validate_and_strip
import pytest

client=TestClient(app)

def test_parse_url_ok():
    assert parse_github_url("https://github.com/octocat/Hello-World")==("octocat","Hello-World")
    assert parse_github_url("https://github.com/octocat/Hello-World.git")==("octocat","Hello-World")
def test_parse_url_rejects_non_github():
    for bad in ["https://evil.com/a/b","https://github.com/onlyowner","javascript:alert(1)","http://github.com/a/b"]:
        with pytest.raises(ValueError): parse_github_url(bad)
def test_filtering():
    tree=[{"type":"blob","path":"src/app.py","size":1000},{"type":"blob","path":"node_modules/x/index.js","size":100},{"type":"blob","path":"logo.png","size":100},{"type":"blob","path":"big.py","size":999999},{"type":"tree","path":"src"}]
    out=filter_files(tree); assert [f["path"] for f in out]==["src/app.py"]
    assert is_filtered("a/b.png")
def test_scoring_weights_and_math():
    assert sum(WEIGHTS.values())==100
    files=[{"path":"README.md","size":1000},{"path":"LICENSE","size":200},{"path":".gitignore","size":50},{"path":"src/main.py","size":5000},{"path":"tests/test_main.py","size":500},{"path":".github/workflows/ci.yml","size":300},{"path":"requirements.txt","size":100},{"path":"SECURITY.md","size":100}]
    r=score_repository(files); s=r["scores"]
    expected=round(sum(s[k]*WEIGHTS[k] for k in WEIGHTS)/100,1)
    assert r["health_score"]==expected and r["health_score"]>70
    empty=score_repository([]); assert empty["health_score"]<50
def test_grounding_rejects_fake_path():
    out=validate_grounding([{"title":"x","file_path":"src/fake.py","confidence":0.9,"evidence":"e"}], ["src/real.py"])
    assert out[0]["file_path"] is None and out[0]["source"]=="ai_inference_unverified" and out[0]["confidence"]<=0.3
    ok=validate_grounding([{"title":"x","file_path":"src/real.py","confidence":0.9}], ["src/real.py"]); assert ok[0]["file_path"]=="src/real.py"
def png_bytes():
    b=io.BytesIO(); Image.new("RGB",(10,10),"red").save(b,format="PNG"); return b.getvalue()
def test_image_validation():
    mime,cleaned,sha=validate_and_strip(png_bytes(), 10*1024*1024); assert mime=="image/png" and len(sha)==64
    with pytest.raises(ValueError): validate_and_strip(b"not an image", 10*1024*1024)
    with pytest.raises(ValueError): validate_and_strip(png_bytes(), 10)
def test_health_and_not_configured_honesty():
    r=client.get("/api/health"); assert r.status_code==200 and r.json()["ai_status"]=="not_configured"
def test_visual_flow_and_publish_gate():
    # seed a repo row directly
    from app.db import SessionLocal
    from app import models
    db=SessionLocal(); repo=models.Repository(full_name="octocat/Hello-World",owner="octocat",name="Hello-World",file_paths='["README.md"]'); db.add(repo); db.commit(); db.refresh(repo); rid=repo.id; db.close()
    r=client.post(f"/api/repositories/{rid}/visual/analyze", files={"image":("shot.png",png_bytes(),"image/png")}, data={"description":"Button overlaps text on mobile","mode":"bug_detective"})
    assert r.status_code==200, r.text; body=r.json(); assert body["ai_status"]=="not_configured" and body["findings"]==[] and body["has_image"] is True
    aid=body["id"]
    d=client.post(f"/api/visual-analyses/{aid}/issue-draft", json={}); assert d.status_code==200 and "Button overlaps" in d.json()["body_md"]
    p1=client.post(f"/api/visual-analyses/{aid}/issue-draft/publish", json={"confirmed":False}); assert p1.status_code==400
    p2=client.post(f"/api/visual-analyses/{aid}/issue-draft/publish", json={"confirmed":True}); assert p2.status_code==403
    dele=client.delete(f"/api/visual-analyses/{aid}/image"); assert dele.status_code==200
def test_bad_image_rejected():
    from app.db import SessionLocal
    from app import models
    db=SessionLocal(); repo=db.query(models.Repository).first(); rid=repo.id; db.close()
    r=client.post(f"/api/repositories/{rid}/visual/analyze", files={"image":("x.png",b"hello","image/png")}, data={"description":"x"})
    assert r.status_code==400
