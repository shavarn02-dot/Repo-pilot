def validate_grounding(findings, valid_paths):
    valid=set(valid_paths); out=[]
    for f in findings:
        g=dict(f); p=g.get("file_path")
        if p and p not in valid:
            g["file_path"]=None; g["source"]="ai_inference_unverified"; g["confidence"]=min(g.get("confidence",0.5),0.3)
            g["evidence"]=(g.get("evidence") or "")+" [Ungrounded file reference removed by validator]"
        out.append(g)
    return out
