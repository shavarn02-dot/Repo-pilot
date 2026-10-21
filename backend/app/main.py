
import json, os, uuid, base64
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from . import models
from .config import GITHUB_TOKEN, VISUAL_STORAGE_DIR, MAX_IMAGE_BYTES
from .github_client import parse_github_url, gh_get, gh_post
from .filtering import filter_files
from .scoring import score_repository
from .grounding import validate_grounding
from . import openrouter
from .image_utils import validate_and_strip

Base.metadata.create_all(bind=engine)
app=FastAPI(title="RepoPilot API", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AnalyzeReq(BaseModel): url: str
class ChatReq(BaseModel): message: str; visual_analysis_id: int|None=None
class PublishReq(BaseModel): confirmed: bool=False; title: str|None=None; body: str|None=None; labels: list[str]=[]
class DraftReq(BaseModel): title: str|None=None; body_md: str|None=None; severity: str|None=None; labels: list[str]|None=None

def now(): return datetime.now(timezone.utc)
def repo_out(r): return {"id":r.id,"owner":r.owner,"name":r.name,"full_name":r.full_name,"description":r.description,"default_branch":r.default_branch,"visibility":r.visibility,"html_url":r.html_url,"languages":json.loads(r.languages or "{}"),"last_analyzed_at":str(r.last_analyzed_at) if r.last_analyzed_at else None}
def get_repo_or_404(db, rid):
    r=db.query(models.Repository).filter_by(id=rid).first()
    if not r: raise HTTPException(404,"Repository not found. Analyze it first.")
    return r
def fetch_file_content(owner,repo,path,branch):
    try:
        data=gh_get(f"/repos/{owner}/{repo}/contents/{path}", GITHUB_TOKEN, params={"ref":branch})
        if data.get("encoding")=="base64" and data.get("content"):
            return base64.b64decode(data["content"]).decode("utf-8",errors="replace")[:20000]
    except Exception: return ""
    return ""

@app.get("/api/health")
def health(): return {"status":"ok","service":"repopilot-api","ai_configured":openrouter.configured(),"ai_status":"configured" if openrouter.configured() else "not_configured","model":openrouter.MODELS[0],"keys_configured":openrouter.key_count(),"key_fallback":openrouter.key_count()>1}

@app.post("/api/repositories/analyze")
def analyze(req: AnalyzeReq, db: Session=Depends(get_db)):
    try: owner,name=parse_github_url(req.url)
    except ValueError as e: raise HTTPException(400,str(e))
    meta=gh_get(f"/repos/{owner}/{name}", GITHUB_TOKEN)
    branch=meta.get("default_branch","main")
    job=models.AnalysisJob(job_type="repository_analysis",status="running",progress=20); db.add(job); db.commit(); db.refresh(job)
    try:
        tree_resp=gh_get(f"/repos/{owner}/{name}/git/trees/{branch}", GITHUB_TOKEN, params={"recursive":"1"})
        files=filter_files(tree_resp.get("tree",[]))
        commit_sha=None
        try:
            commits=gh_get(f"/repos/{owner}/{name}/commits", GITHUB_TOKEN, params={"per_page":1,"sha":branch})
            if commits: commit_sha=commits[0].get("sha")
        except Exception: pass
        langs={}
        try: langs=gh_get(f"/repos/{owner}/{name}/languages", GITHUB_TOKEN)
        except Exception: langs={}
        repo=db.query(models.Repository).filter_by(full_name=meta["full_name"]).first() or models.Repository(full_name=meta["full_name"])
        repo.github_repo_id=meta.get("id"); repo.owner=owner; repo.name=name; repo.description=meta.get("description"); repo.default_branch=branch; repo.visibility="private" if meta.get("private") else "public"; repo.html_url=meta.get("html_url"); repo.languages=json.dumps(langs); repo.file_paths=json.dumps([f["path"] for f in files]); repo.last_analyzed_at=now(); db.add(repo); db.commit(); db.refresh(repo)
        result=score_repository(files)
        summary=f"Deterministic analysis of {len(files)} files in {meta['full_name']}. Health score {result['health_score']}/100 (scoring v1.0). {len(result['findings'])} deterministic findings."
        ai_status="not_configured"; ai_findings=[]
        if openrouter.configured():
            prompt=[{"role":"user","content":json.dumps({"task":"Explain this repository health report and add at most 5 findings. Return JSON {summary:string, findings:[{category,severity,title,description,file_path,evidence,suggested_fix,confidence}]}. Only use these file paths.","files":[f["path"] for f in files][:200],"scores":result["scores"],"deterministic_findings":result["findings"]})} ]
            ai=openrouter.chat(prompt)
            if ai:
                ai_status="completed"; summary=ai["json"].get("summary",summary)
                ai_findings=validate_grounding(ai["json"].get("findings",[]), [f["path"] for f in files])
            else: ai_status="provider_error"
        report=models.Report(repository_id=repo.id, job_id=job.id, health_score=result["health_score"], maintainability_score=result["scores"]["maintainability"], security_score=result["scores"]["security"], testing_score=result["scores"]["testing"], documentation_score=result["scores"]["documentation"], cicd_score=result["scores"]["cicd"], structure_score=result["scores"]["structure"], summary=summary, ai_status=ai_status, coverage=json.dumps(result["coverage"]))
        db.add(report); db.commit(); db.refresh(report)
        all_findings=[]
        for f in result["findings"]+ai_findings:
            row=models.Finding(report_id=report.id, category=f.get("category","general"), severity=f.get("severity","info"), title=f.get("title","Finding"), description=f.get("description",""), file_path=f.get("file_path"), line_start=f.get("line_start"), line_end=f.get("line_end"), evidence=f.get("evidence",""), suggested_fix=f.get("suggested_fix",""), confidence=f.get("confidence",1.0), source=f.get("source","deterministic" if f in result["findings"] else "ai_inference"))
            db.add(row); all_findings.append(row)
        db.commit()
        job.status="completed"; job.progress=100; job.repository_id=repo.id; job.commit_sha=commit_sha; job.completed_at=now(); db.commit()
        return {"repository":repo_out(repo),"job_id":job.id,"commit_sha":commit_sha,"report":report_out(db,report)}
    except HTTPException as e:
        job.status="failed"; job.error_code=str(e.detail); db.commit(); raise
    except Exception as e:
        job.status="failed"; job.error_code=str(e); db.commit(); raise HTTPException(502,f"Analysis failed: {e}")

def report_out(db, report):
    findings=db.query(models.Finding).filter_by(report_id=report.id).all() if report else []
    if not report: return None
    return {"id":report.id,"repository_id":report.repository_id,"scoring_version":report.scoring_version,"health_score":report.health_score,"scores":{"maintainability":report.maintainability_score,"security":report.security_score,"testing":report.testing_score,"documentation":report.documentation_score,"cicd":report.cicd_score,"structure":report.structure_score},"summary":report.summary,"ai_status":report.ai_status,"coverage":json.loads(report.coverage or "{}"),"created_at":str(report.created_at),"findings":[{"id":f.id,"category":f.category,"severity":f.severity,"title":f.title,"description":f.description,"file_path":f.file_path,"line_start":f.line_start,"line_end":f.line_end,"evidence":f.evidence,"suggested_fix":f.suggested_fix,"confidence":f.confidence,"source":f.source} for f in findings]}

@app.get("/api/repositories/{rid}")
def get_repo(rid:int, db:Session=Depends(get_db)): return repo_out(get_repo_or_404(db,rid))
@app.get("/api/repositories")
def list_repos(db:Session=Depends(get_db)): return [repo_out(r) for r in db.query(models.Repository).order_by(models.Repository.id.desc()).all()]
@app.get("/api/repositories/{rid}/report")
def get_report(rid:int, db:Session=Depends(get_db)):
    get_repo_or_404(db,rid); rep=db.query(models.Report).filter_by(repository_id=rid).order_by(models.Report.id.desc()).first()
    if not rep: raise HTTPException(404,"No report yet for this repository")
    return report_out(db,rep)
@app.get("/api/repositories/{rid}/files")
def get_files(rid:int, db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid); return {"repository_id":rid,"files":json.loads(r.file_paths or "[]")}
@app.get("/api/jobs/{jid}")
def get_job(jid:int, db:Session=Depends(get_db)):
    j=db.query(models.AnalysisJob).filter_by(id=jid).first()
    if not j: raise HTTPException(404,"Job not found")
    return {"id":j.id,"repository_id":j.repository_id,"job_type":j.job_type,"status":j.status,"progress":j.progress,"error_code":j.error_code,"commit_sha":j.commit_sha}

@app.get("/api/repositories/{rid}/pull-requests")
def list_prs(rid:int, db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid); prs=gh_get(f"/repos/{r.owner}/{r.name}/pulls", GITHUB_TOKEN, params={"state":"open","per_page":30})
    return [{"number":p["number"],"title":p["title"],"state":p["state"],"user":p["user"]["login"] if p.get("user") else None,"html_url":p["html_url"],"created_at":p["created_at"],"head_sha":p["head"]["sha"] if p.get("head") else None} for p in prs]

@app.post("/api/repositories/{rid}/pull-requests/{number}/analyze")
def analyze_pr(rid:int, number:int, db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid)
    pr=gh_get(f"/repos/{r.owner}/{r.name}/pulls/{number}", GITHUB_TOKEN)
    files=gh_get(f"/repos/{r.owner}/{r.name}/pulls/{number}/files", GITHUB_TOKEN, params={"per_page":100})
    findings=[]; diff_parts=[]
    changed=[f["filename"] for f in files]
    has_tests=any("test" in c.lower() or "spec" in c.lower() for c in changed)
    code_changed=any(c.endswith((".py",".js",".ts",".tsx",".go",".java",".rb")) for c in changed)
    for f in files:
        patch=f.get("patch","") or ""; diff_parts.append(f"--- {f['filename']}\n{patch}")
        for kw in ("password","api_key","secret","token ="):
            if kw in patch.lower() and "+" in patch:
                findings.append({"category":"security","severity":"high","title":f"Possible secret-related change in {f['filename']}","description":"Patch contains a secret-like keyword on changed lines. Verify no credential is committed.","file_path":f["filename"],"evidence":"Keyword matched in PR patch (value not reproduced)","suggested_fix":"Move secrets to environment variables / secret storage.","confidence":0.6,"source":"deterministic"})
                break
    if code_changed and not has_tests: findings.append({"category":"testing","severity":"medium","title":"Code changed without test changes","description":"This PR changes code files but no test files.","file_path":changed[0] if changed else None,"evidence":f"Changed files: {', '.join(changed[:10])}","suggested_fix":"Add or update tests covering the changed behaviour.","confidence":1.0,"source":"deterministic"})
    if len(files)>20: findings.append({"category":"maintainability","severity":"medium","title":"Large pull request","description":f"{len(files)} files changed, which is hard to review thoroughly.","file_path":None,"evidence":f"{len(files)} files in PR file list","suggested_fix":"Consider splitting into smaller PRs.","confidence":1.0,"source":"deterministic"})
    summary=f"PR #{number}: {pr.get('title')} — {len(files)} files changed, +{pr.get('additions',0)}/-{pr.get('deletions',0)}. Read-only review; nothing was posted to GitHub."
    ai_status="not_configured"
    if openrouter.configured():
        ai=openrouter.chat([{"role":"user","content":json.dumps({"task":"Review this PR diff. Return JSON {summary, findings:[{category,severity,title,description,file_path,evidence,suggested_fix,confidence}]} using only changed files.","changed_files":changed,"diff":"\n".join(diff_parts)[:12000]})}])
        if ai: ai_status="completed"; summary=ai["json"].get("summary",summary); findings+=validate_grounding(ai["json"].get("findings",[]), changed)
        else: ai_status="provider_error"
    review=models.PullRequestReview(repository_id=rid, github_pr_number=number, head_sha=pr["head"]["sha"] if pr.get("head") else None, review_summary=summary, findings=json.dumps(findings), diff="\n".join(diff_parts)[:50000]); db.add(review); db.commit(); db.refresh(review)
    return {"id":review.id,"pr_number":number,"summary":summary,"ai_status":ai_status,"findings":findings,"changed_files":changed,"diff":review.diff}

@app.get("/api/pull-request-reviews/{review_id}")
def get_review(review_id:int, db:Session=Depends(get_db)):
    rev=db.query(models.PullRequestReview).filter_by(id=review_id).first()
    if not rev: raise HTTPException(404,"Review not found")
    return {"id":rev.id,"repository_id":rev.repository_id,"pr_number":rev.github_pr_number,"summary":rev.review_summary,"findings":json.loads(rev.findings or "[]"),"diff":rev.diff}

@app.get("/api/repositories/{rid}/issues")
def list_issues(rid:int, db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid); issues=gh_get(f"/repos/{r.owner}/{r.name}/issues", GITHUB_TOKEN, params={"state":"open","per_page":50})
    return [{"number":i["number"],"title":i["title"],"body":(i.get("body") or "")[:1000],"labels":[l["name"] for l in i.get("labels",[])],"html_url":i["html_url"],"created_at":i["created_at"]} for i in issues if "pull_request" not in i]

def triage_one(issue):
    text=(issue["title"]+" "+(issue.get("body") or "")).lower()
    if any(k in text for k in ("bug","error","crash","fail","broken","exception")): cat,labels="bug",["bug"]
    elif any(k in text for k in ("docs","readme","documentation")): cat,labels="documentation",["documentation"]
    elif any(k in text for k in ("test","coverage")): cat,labels="testing",["testing"]
    elif any(k in text for k in ("feature","add ","support","enhancement","request")): cat,labels="enhancement",["enhancement"]
    elif "?" in issue["title"] or "how to" in text: cat,labels="question",["question"]
    else: cat,labels="maintenance",["maintenance"]
    complexity="low" if len(text)<200 else "medium" if len(text)<600 else "high"
    return {"number":issue["number"],"title":issue["title"],"category":cat,"suggested_labels":labels,"complexity":complexity,"beginner_friendly":complexity=="low" and cat in ("documentation","bug"),"source":"deterministic_rules"}

@app.post("/api/repositories/{rid}/issues/triage")
def triage(rid:int, db:Session=Depends(get_db)):
    issues=list_issues(rid,db); return {"repository_id":rid,"ai_status":"configured" if openrouter.configured() else "not_configured","note":"Label suggestions only — nothing was modified on GitHub.","triage":[triage_one(i) for i in issues]}

@app.post("/api/repositories/{rid}/chat")
def chat(rid:int, req:ChatReq, db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid); paths=json.loads(r.file_paths or "[]")
    tokens=[t.lower().strip("?.,") for t in req.message.split() if len(t)>2]
    candidates=[]
    for p in paths:
        low=p.lower()
        if any(t in low for t in tokens) or low=="readme.md": candidates.append(p)
    candidates=candidates[:5]
    evidence=[]
    for p in candidates:
        content=fetch_file_content(r.owner,r.name,p,r.default_branch)
        if content:
            lines=[ln for ln in content.splitlines() if any(t in ln.lower() for t in tokens)][:5]
            evidence.append({"file":p,"lines":lines or content.splitlines()[:3]})
    if openrouter.configured():
        ai=openrouter.chat([{"role":"user","content":json.dumps({"task":"Answer using ONLY the evidence. Return JSON {answer}. If evidence is insufficient say so.","question":req.message,"evidence":evidence})}])
        if ai: return {"answer":ai["json"].get("answer",""),"citations":[e["file"] for e in evidence],"ai_status":"completed","grounded":bool(evidence)}
    if not evidence: return {"answer":"Insufficient evidence in the retrieved repository files to answer this. Try naming a file or module, or check the Files list.","citations":[],"ai_status":"not_configured" if not openrouter.configured() else "completed","grounded":False,"mode":"extractive"}
    ans="Extractive answer (AI not configured — showing matching lines from real repository files):\n"+"\n".join(f"{e['file']}: "+ " | ".join(e["lines"]) for e in evidence)
    return {"answer":ans,"citations":[e["file"] for e in evidence],"ai_status":"not_configured" if not openrouter.configured() else "completed","grounded":True,"mode":"extractive"}

def store_image(data:bytes):
    mime,cleaned,sha=validate_and_strip(data, MAX_IMAGE_BYTES)
    os.makedirs(VISUAL_STORAGE_DIR, exist_ok=True)
    ext={"image/png":".png","image/jpeg":".jpg","image/webp":".webp"}[mime]
    key=f"{uuid.uuid4().hex}{ext}"; path=os.path.join(VISUAL_STORAGE_DIR,key)
    with open(path,"wb") as f: f.write(cleaned)
    return key,mime,len(cleaned),sha

def visual_out(db, va):
    findings=db.query(models.Finding).filter_by(visual_analysis_id=va.id).all()
    return {"id":va.id,"repository_id":va.repository_id,"mode":va.mode,"status":va.status,"ai_status":va.ai_status,"description":va.description,"image_mime":va.image_mime,"image_bytes":va.image_bytes,"image_sha256":va.image_sha256,"has_image":bool(va.image_storage_key),"pr_number":va.pr_number,"created_at":str(va.created_at),"findings":[{"id":f.id,"severity":f.severity,"title":f.title,"description":f.description,"file_path":f.file_path,"evidence":f.evidence,"suggested_fix":f.suggested_fix,"confidence":f.confidence,"source":f.source} for f in findings],"message":"AI vision is not configured (no OPENROUTER_API_KEY). Image stored securely; no findings were fabricated." if va.ai_status=="not_configured" else None}

@app.post("/api/repositories/{rid}/visual/analyze")
async def visual_analyze(rid:int, image: UploadFile=File(...), description: str=Form(""), mode: str=Form("bug_detective"), db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid); data=await image.read()
    try: key,mime,size,sha=store_image(data)
    except ValueError as e: raise HTTPException(400,str(e))
    job=models.AnalysisJob(repository_id=rid, job_type="visual_analysis", status="completed" if not openrouter.configured() else "running", progress=100 if not openrouter.configured() else 50); db.add(job); db.commit(); db.refresh(job)
    va=models.VisualAnalysis(repository_id=rid, job_id=job.id, mode=mode, image_storage_key=key, image_mime=mime, image_bytes=size, image_sha256=sha, description=description, status="not_configured" if not openrouter.configured() else "processing", ai_status="not_configured" if not openrouter.configured() else "processing"); db.add(va); db.commit(); db.refresh(va)
    if openrouter.configured():
        paths=json.loads(r.file_paths or "[]")
        with open(os.path.join(VISUAL_STORAGE_DIR,key),"rb") as fh: b64=base64.b64encode(fh.read()).decode()
        ai=openrouter.chat([{"role":"user","content":json.dumps({"task":"Analyse the screenshot description for UI bugs. The image itself was provided to the vision model in the full deployment; use description + repo files. Return JSON {findings:[{severity,title,description,file_path,evidence,suggested_fix,confidence}]}. Only cite files from the list.","description":description,"repo_files":paths[:200],"image_data_url_prefix":f"data:{mime};base64,"+b64[:100]})}])
        va.ai_status="completed" if ai else "provider_error"; va.status=va.ai_status
        if ai:
            for f in validate_grounding(ai["json"].get("findings",[]), paths):
                db.add(models.Finding(visual_analysis_id=va.id, category="visual", severity=f.get("severity","medium"), title=f.get("title","Visual finding"), description=f.get("description",""), file_path=f.get("file_path"), evidence=f.get("evidence",""), suggested_fix=f.get("suggested_fix",""), confidence=f.get("confidence",0.5), source=f.get("source","ai_inference")))
        job.status="completed"; job.progress=100; db.commit(); db.refresh(va)
    return visual_out(db,va)

@app.get("/api/visual-analyses/{aid}")
def get_visual(aid:int, db:Session=Depends(get_db)):
    va=db.query(models.VisualAnalysis).filter_by(id=aid).first()
    if not va: raise HTTPException(404,"Visual analysis not found")
    return visual_out(db,va)

@app.post("/api/visual-analyses/{aid}/issue-draft")
def issue_draft(aid:int, req:DraftReq=Body(default=DraftReq()), db:Session=Depends(get_db)):
    va=db.query(models.VisualAnalysis).filter_by(id=aid).first()
    if not va: raise HTTPException(404,"Visual analysis not found")
    draft=db.query(models.IssueDraft).filter_by(visual_analysis_id=aid).order_by(models.IssueDraft.id.desc()).first()
    if req.title or req.body_md:
        if not draft: draft=models.IssueDraft(visual_analysis_id=aid, repository_id=va.repository_id, title="", body_md=""); db.add(draft)
        if req.title: draft.title=req.title
        if req.body_md: draft.body_md=req.body_md
        if req.severity: draft.severity=req.severity
        if req.labels is not None: draft.labels=json.dumps(req.labels)
        db.commit(); db.refresh(draft); return draft_out(draft)
    desc=(va.description or "Visual issue reported via screenshot").strip()
    title=req.title or (desc[:80] if desc else "Visual bug reported from screenshot")
    body=f"## Summary\n{desc}\n\n## Steps to reproduce\n1. Open the screen shown in the attached screenshot.\n2. Observe the issue described above.\n\n_Steps are based only on the user description and screenshot; verify before publishing._\n\n## Expected\nThe UI renders and behaves as designed.\n\n## Actual\n{desc}\n\n## Severity\n{req.severity or 'medium'}\n\n## Screenshot\nStored in RepoPilot Visual Debugger (analysis #{va.id}, sha256 {va.image_sha256}).\n"
    draft=models.IssueDraft(visual_analysis_id=aid, repository_id=va.repository_id, title=title, body_md=body, severity=req.severity or "medium", labels=json.dumps(req.labels if req.labels is not None else ["bug","ui"])); db.add(draft); db.commit(); db.refresh(draft); return draft_out(draft)
def draft_out(d): return {"id":d.id,"visual_analysis_id":d.visual_analysis_id,"repository_id":d.repository_id,"title":d.title,"body_md":d.body_md,"severity":d.severity,"labels":json.loads(d.labels or "[]"),"status":d.status,"github_issue_url":d.github_issue_url}

@app.post("/api/visual-analyses/{aid}/issue-draft/publish")
def publish_issue(aid:int, req:PublishReq, db:Session=Depends(get_db)):
    if req.confirmed is not True: raise HTTPException(400,"Explicit confirmation is required: send confirmed=true after reviewing the draft preview.")
    if not GITHUB_TOKEN: raise HTTPException(403,"GitHub token / OAuth is not configured on the server, so RepoPilot cannot publish. Copy the draft markdown instead.")
    draft=db.query(models.IssueDraft).filter_by(visual_analysis_id=aid).order_by(models.IssueDraft.id.desc()).first()
    if not draft: raise HTTPException(404,"No issue draft exists for this analysis")
    repo=db.query(models.Repository).filter_by(id=draft.repository_id).first()
    title=req.title or draft.title; body=req.body or draft.body_md; labels=req.labels or json.loads(draft.labels or "[]")
    resp=gh_post(f"/repos/{repo.owner}/{repo.name}/issues", GITHUB_TOKEN, {"title":title,"body":body,"labels":labels})
    if resp.status_code>=300: raise HTTPException(502,f"GitHub issue creation failed ({resp.status_code})")
    data=resp.json(); draft.status="published"; draft.github_issue_number=data.get("number"); draft.github_issue_url=data.get("html_url"); draft.published_at=now(); db.commit()
    return {"status":"published","github_issue_number":draft.github_issue_number,"github_issue_url":draft.github_issue_url}

@app.post("/api/repositories/{rid}/pull-requests/{number}/visual-review")
async def visual_pr(rid:int, number:int, before_image: UploadFile=File(...), after_image: UploadFile=File(...), db:Session=Depends(get_db)):
    r=get_repo_or_404(db,rid)
    try: k1,m1,s1,sha1=store_image(await before_image.read()); k2,m2,s2,sha2=store_image(await after_image.read())
    except ValueError as e: raise HTTPException(400,str(e))
    va=models.VisualAnalysis(repository_id=rid, mode="pr_visual", image_storage_key=k1, after_image_key=k2, image_mime=m1, image_bytes=s1+s2, image_sha256=sha2, description=f"Visual PR review for PR #{number} (before/after)", status="not_configured" if not openrouter.configured() else "processing", ai_status="not_configured" if not openrouter.configured() else "processing", pr_number=number); db.add(va); db.commit(); db.refresh(va)
    out=visual_out(db,va); out["before_image_stored"]=True; out["after_image_stored"]=True; return out

@app.delete("/api/visual-analyses/{aid}/image")
def delete_image(aid:int, db:Session=Depends(get_db)):
    va=db.query(models.VisualAnalysis).filter_by(id=aid).first()
    if not va: raise HTTPException(404,"Visual analysis not found")
    for key in [va.image_storage_key, va.after_image_key]:
        if key:
            path=os.path.join(VISUAL_STORAGE_DIR,key)
            if os.path.exists(path): os.remove(path)
    va.image_storage_key=None; va.after_image_key=None; va.status="image_deleted"; db.commit()
    return {"status":"image_deleted","id":aid}
