from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from datetime import datetime, timezone
from .db import Base
def now(): return datetime.now(timezone.utc)
class Repository(Base):
    __tablename__="repositories"
    id=Column(Integer,primary_key=True); github_repo_id=Column(Integer); owner=Column(String(200)); name=Column(String(200)); full_name=Column(String(400),unique=True)
    description=Column(Text); default_branch=Column(String(200)); visibility=Column(String(50),default="public"); html_url=Column(String(500)); languages=Column(Text,default="{}"); file_paths=Column(Text,default="[]"); last_analyzed_at=Column(DateTime,default=now)
class AnalysisJob(Base):
    __tablename__="analysis_jobs"
    id=Column(Integer,primary_key=True); repository_id=Column(Integer,ForeignKey("repositories.id"),nullable=True); job_type=Column(String(100),default="repository_analysis"); status=Column(String(50),default="pending"); progress=Column(Integer,default=0); error_code=Column(String(200),nullable=True); commit_sha=Column(String(100),nullable=True); created_at=Column(DateTime,default=now); completed_at=Column(DateTime,nullable=True)
class Report(Base):
    __tablename__="reports"
    id=Column(Integer,primary_key=True); repository_id=Column(Integer,ForeignKey("repositories.id")); job_id=Column(Integer,ForeignKey("analysis_jobs.id"),nullable=True); scoring_version=Column(String(20),default="1.0"); health_score=Column(Float); maintainability_score=Column(Float); security_score=Column(Float); testing_score=Column(Float); documentation_score=Column(Float); cicd_score=Column(Float); structure_score=Column(Float); summary=Column(Text); ai_status=Column(String(50),default="not_configured"); coverage=Column(Text,default="{}"); created_at=Column(DateTime,default=now)
class Finding(Base):
    __tablename__="findings"
    id=Column(Integer,primary_key=True); report_id=Column(Integer,ForeignKey("reports.id"),nullable=True); visual_analysis_id=Column(Integer,nullable=True); category=Column(String(100)); severity=Column(String(50)); title=Column(String(500)); description=Column(Text); file_path=Column(String(1000),nullable=True); line_start=Column(Integer,nullable=True); line_end=Column(Integer,nullable=True); evidence=Column(Text); suggested_fix=Column(Text); confidence=Column(Float,default=1.0); source=Column(String(100),default="deterministic")
class PullRequestReview(Base):
    __tablename__="pull_request_reviews"
    id=Column(Integer,primary_key=True); repository_id=Column(Integer,ForeignKey("repositories.id")); github_pr_number=Column(Integer); head_sha=Column(String(100),nullable=True); review_summary=Column(Text); status=Column(String(50),default="completed"); findings=Column(Text,default="[]"); diff=Column(Text,default=""); before_image_key=Column(String(500),nullable=True); after_image_key=Column(String(500),nullable=True); created_at=Column(DateTime,default=now)
class VisualAnalysis(Base):
    __tablename__="visual_analyses"
    id=Column(Integer,primary_key=True); repository_id=Column(Integer,ForeignKey("repositories.id")); job_id=Column(Integer,nullable=True); mode=Column(String(50),default="bug_detective"); image_storage_key=Column(String(500),nullable=True); after_image_key=Column(String(500),nullable=True); image_mime=Column(String(100),nullable=True); image_bytes=Column(Integer,nullable=True); image_sha256=Column(String(100),nullable=True); description=Column(Text); status=Column(String(50),default="not_configured"); ai_status=Column(String(50),default="not_configured"); model_id=Column(String(200),nullable=True); pr_number=Column(Integer,nullable=True); created_at=Column(DateTime,default=now)
class IssueDraft(Base):
    __tablename__="issue_drafts"
    id=Column(Integer,primary_key=True); visual_analysis_id=Column(Integer,ForeignKey("visual_analyses.id")); repository_id=Column(Integer); title=Column(String(500)); body_md=Column(Text); severity=Column(String(50),default="medium"); labels=Column(Text,default="[]"); status=Column(String(50),default="draft"); github_issue_number=Column(Integer,nullable=True); github_issue_url=Column(String(500),nullable=True); published_at=Column(DateTime,nullable=True)
