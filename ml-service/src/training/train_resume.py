"""
Training Script — Resume Parser (NER + rule-based)
Uses spaCy en_core_web_sm + custom pattern matchers.
The "model" saved here is a config dict with compiled regex patterns
and skill keywords used by the resume_parser service.
"""

import os, re, json, joblib

# ── Skill taxonomy ────────────────────────────────────────────────────────────
SKILLS_DB = {
    "programming": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "julia",
    ],
    "web": [
        "react", "angular", "vue", "next.js", "nuxt", "svelte", "html", "css",
        "tailwind", "bootstrap", "flask", "django", "fastapi", "express", "node.js",
        "graphql", "rest", "soap",
    ],
    "data": [
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
        "spark", "hadoop", "airflow", "dbt", "tableau", "power bi", "excel",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    ],
    "devops": [
        "docker", "kubernetes", "jenkins", "github actions", "gitlab ci", "terraform",
        "ansible", "aws", "azure", "gcp", "linux", "bash", "nginx",
    ],
    "soft_skills": [
        "leadership", "communication", "teamwork", "problem solving", "agile",
        "scrum", "kanban", "jira", "confluence",
    ],
}

# ── Regex patterns ────────────────────────────────────────────────────────────
PATTERNS = {
    "email":   r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "phone":   r"(\+?\d[\d\s\-().]{7,}\d)",
    "linkedin": r"linkedin\.com/in/[\w\-]+",
    "github":  r"github\.com/[\w\-]+",

    # Education degrees
    "degree": (
        r"\b(B\.?Tech|B\.?E|B\.?Sc|M\.?Tech|M\.?Sc|MBA|Ph\.?D|BCA|MCA|"
        r"Bachelor[s]?|Master[s]?|Doctor(?:ate)?)\b"
    ),

    # Year ranges for experience
    "year_range": r"((?:19|20)\d{2})\s*[-–—to]+\s*((?:19|20)\d{2}|present|current)",

    # Section headers
    "sections": (
        r"(?i)^(experience|education|skills?|projects?|certifications?|"
        r"achievements?|publications?|languages?|interests?|summary|objective|"
        r"contact|work\s+history|employment)\s*:?\s*$"
    ),
}

# ── Experience level thresholds (years) ──────────────────────────────────────
EXPERIENCE_BANDS = {
    "fresher":     (0, 1),
    "junior":      (1, 3),
    "mid-level":   (3, 6),
    "senior":      (6, 10),
    "lead/expert": (10, 99),
}


def build_resume_config():
    return {
        "skills_db": SKILLS_DB,
        "patterns": PATTERNS,
        "experience_bands": EXPERIENCE_BANDS,
        "all_skills_flat": [
            skill
            for category in SKILLS_DB.values()
            for skill in category
        ],
    }


def train():
    print("🔧  Building Resume Parser config...")
    config = build_resume_config()

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(out_dir, exist_ok=True)

    # Save as joblib for consistency with other models
    joblib.dump(config, os.path.join(out_dir, "resume_parser.pkl"))

    # Also dump skills DB as JSON for easy debugging
    with open(os.path.join(out_dir, "skills_db.json"), "w") as f:
        json.dump(SKILLS_DB, f, indent=2)

    print("✅  resume_parser.pkl saved")
    print(f"   Total skills indexed: {len(config['all_skills_flat'])}")


if __name__ == "__main__":
    train()