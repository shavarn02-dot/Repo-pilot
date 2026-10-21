WEIGHTS={"maintainability":25,"security":25,"testing":20,"documentation":15,"cicd":10,"structure":5}
def _has(paths, pred): return any(pred(p) for p in paths)
def _finding(cat,sev,title,desc,path,evidence,fix): return {"category":cat,"severity":sev,"title":title,"description":desc,"file_path":path,"evidence":evidence,"suggested_fix":fix,"confidence":1.0,"source":"deterministic","line_start":None,"line_end":None}
def score_repository(files):
    paths=[f["path"] for f in files]; low=[p.lower() for p in paths]; findings=[]
    # Documentation
    readme=[p for p in paths if p.lower()=="readme.md" or p.lower()=="readme"]
    docs=_has(low, lambda p: p.startswith("docs/")); contrib=_has(low, lambda p:"contributing" in p)
    doc_score=(50 if readme else 0)+(20 if docs else 0)+(20 if contrib else 0)+(10 if _has(low,lambda p:"changelog" in p) else 5 if readme else 0)
    if not readme: findings.append(_finding("documentation","high","No README at repository root","Users cannot understand the project from its root.",None,"No README file found in file tree","Add a README.md describing purpose, setup and usage."))
    elif not docs: findings.append(_finding("documentation","low","No docs/ directory","Extended documentation was not found.","docs","README present but no docs/ path in tree","Add docs/ for architecture and usage guides when the project grows."))
    # Testing
    tests=[p for p in low if ("test" in p or "spec" in p) and not p.startswith("node_modules")]
    test_score=0
    if tests: test_score=60+min(40, len(tests)*4)
    else: findings.append(_finding("testing","high","No test files detected","No files or directories indicating tests were found.",None,"Searched tree for test/spec paths; none matched","Add unit tests and a test command."))
    # CI/CD
    ci=_has(low, lambda p: p.startswith(".github/workflows/") and (p.endswith(".yml") or p.endswith(".yaml")))
    cicd_score=(80 if ci else 0)+(20 if _has(low,lambda p:p in ("dockerfile","docker-compose.yml","docker-compose.yaml")) else 0)
    if not ci: findings.append(_finding("cicd","medium","No GitHub Actions workflow detected","CI configuration was not found.", ".github/workflows","No workflow YAML under .github/workflows/","Add a CI workflow that runs tests on pull requests."))
    # Security
    sec_score=100; exposed=[p for p in paths if p.split("/")[-1] in (".env",) or p.lower().endswith((".pem",".key"))]
    if exposed: sec_score-=60; findings.append(_finding("security","critical","Possible secret file committed",f"File {exposed[0]} may contain secrets.",exposed[0],f"Path present in tree: {exposed[0]}","Remove the file, rotate any exposed credentials, and add it to .gitignore."))
    if not _has(low, lambda p:p=="security.md"): sec_score-=10; findings.append(_finding("security","low","No SECURITY.md","No vulnerability reporting policy found.","SECURITY.md","No SECURITY.md at root","Add SECURITY.md with a reporting process."))
    if not _has(low, lambda p:p==".gitignore"): sec_score-=15; findings.append(_finding("security","medium","No .gitignore","Without .gitignore, secrets and build output are easier to commit accidentally.",None,"No .gitignore in tree","Add a .gitignore covering .env, dependencies and build output."))
    sec_score=max(0,sec_score)
    # Structure
    has_license=_has(low, lambda p:p.startswith("license")); has_gitignore=_has(low, lambda p:p==".gitignore")
    root_files=[p for p in paths if "/" not in p]
    struct_score=(35 if has_license else 0)+(25 if has_gitignore else 0)+(25 if readme else 0)+(15 if len(root_files)<=25 else 5)
    if not has_license: findings.append(_finding("structure","medium","No LICENSE file","Open-source reuse terms are unclear.",None,"No LICENSE path in tree","Add a LICENSE file (for example MIT)."))
    # Maintainability
    src_dirs=_has(low, lambda p: "/" in p); manifest=_has(low, lambda p: p.split("/")[-1] in ("package.json","pyproject.toml","requirements.txt","go.mod","cargo.toml","pom.xml","composer.json"))
    maint_score=(40 if src_dirs else 15)+(30 if manifest else 10)+(30 if len(paths)>=3 else 10)
    if not manifest: findings.append(_finding("maintainability","medium","No dependency manifest detected","No standard manifest was found, so setup may be unclear.",None,"Checked package.json/pyproject.toml/requirements.txt/go.mod/Cargo.toml","Add a manifest that declares runtime and dev dependencies."))
    scores={"maintainability":maint_score,"security":sec_score,"testing":test_score,"documentation":doc_score,"cicd":cicd_score,"structure":struct_score}
    overall=sum(scores[k]*WEIGHTS[k] for k in WEIGHTS)/100.0
    return {"scores":scores,"health_score":round(overall,1),"findings":findings,"coverage":{"files_in_tree":len(files),"files_listed":len(files)}}
