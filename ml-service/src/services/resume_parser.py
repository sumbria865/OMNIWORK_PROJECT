"""
Service — Resume Parser & Employee Profile Auto-fill
Supports PDF and DOCX uploads.
Uses spaCy NER + regex patterns + skill keyword matching.
"""

import os, re, io, joblib
from datetime import datetime

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_config    = None
_nlp       = None   # lazy-loaded spaCy model


def _load():
    global _config, _nlp
    if _config is None:
        _config = joblib.load(os.path.join(_MODEL_DIR, "resume_parser.pkl"))
    if _nlp is None:
        import spacy
        _nlp = spacy.load("en_core_web_sm")


# ── Text extraction helpers ───────────────────────────────────────────────────

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    from pdfminer.high_level import extract_text as pdf_extract
    return pdf_extract(io.BytesIO(file_bytes))


def _extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return _extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        return _extract_text_from_docx(file_bytes)
    else:
        # plain text fallback
        return file_bytes.decode("utf-8", errors="ignore")


# ── Field extractors ──────────────────────────────────────────────────────────

def _extract_email(text: str, patterns: dict) -> str:
    match = re.search(patterns["email"], text)
    return match.group(0) if match else ""


def _extract_phone(text: str, patterns: dict) -> str:
    match = re.search(patterns["phone"], text)
    return match.group(0).strip() if match else ""


def _extract_linkedin(text: str, patterns: dict) -> str:
    match = re.search(patterns["linkedin"], text, re.IGNORECASE)
    return match.group(0) if match else ""


def _extract_github(text: str, patterns: dict) -> str:
    match = re.search(patterns["github"], text, re.IGNORECASE)
    return match.group(0) if match else ""


def _extract_name(text: str, nlp) -> str:
    """Use spaCy PERSON NER on the first 500 chars (header area)."""
    doc = nlp(text[:500])
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    return ""


def _extract_skills(text: str, all_skills: list, skills_db: dict) -> dict:
    text_lower = text.lower()
    found: dict = {cat: [] for cat in skills_db}
    for cat, skills in skills_db.items():
        for skill in skills:
            # whole-word match
            if re.search(r"\b" + re.escape(skill) + r"\b", text_lower):
                found[cat].append(skill)
    return found


def _extract_experience_years(text: str, patterns: dict) -> float:
    """Sum up year ranges found in the text."""
    matches = re.findall(patterns["year_range"], text, re.IGNORECASE)
    total = 0.0
    current_year = datetime.now().year
    for start, end in matches:
        s = int(start)
        e = current_year if end.lower() in ("present", "current") else int(end)
        diff = max(0, e - s)
        total += diff
    return round(min(total, 40), 1)   # cap at 40 years


def _experience_band(years: float, bands: dict) -> str:
    for band, (lo, hi) in bands.items():
        if lo <= years < hi:
            return band
    return "lead/expert"


def _extract_education(text: str, patterns: dict, nlp) -> list:
    """Find degree mentions and nearby institution names."""
    results = []
    for match in re.finditer(patterns["degree"], text, re.IGNORECASE):
        start = max(0, match.start() - 80)
        end   = min(len(text), match.end() + 120)
        snippet = text[start:end].replace("\n", " ").strip()
        results.append(snippet)
    return results[:5]   # cap at 5 entries


def _extract_sections(text: str, patterns: dict) -> dict:
    """Split resume into named sections."""
    sections: dict = {}
    current = "header"
    sections[current] = []
    for line in text.splitlines():
        if re.match(patterns["sections"], line.strip()):
            current = line.strip().lower().rstrip(":")
            sections[current] = []
        else:
            sections[current].append(line)
    return {k: "\n".join(v).strip() for k, v in sections.items() if v}


# ── Main parse function ───────────────────────────────────────────────────────

def parse_resume(file_bytes: bytes, filename: str) -> dict:
    _load()

    text     = extract_text(file_bytes, filename)
    patterns = _config["patterns"]
    skills_db = _config["skills_db"]
    all_skills = _config["all_skills_flat"]
    bands    = _config["experience_bands"]

    name        = _extract_name(text, _nlp)
    email       = _extract_email(text, patterns)
    phone       = _extract_phone(text, patterns)
    linkedin    = _extract_linkedin(text, patterns)
    github      = _extract_github(text, patterns)
    skills      = _extract_skills(text, all_skills, skills_db)
    exp_years   = _extract_experience_years(text, patterns)
    exp_band    = _experience_band(exp_years, bands)
    education   = _extract_education(text, patterns, _nlp)
    sections    = _extract_sections(text, patterns)
    summary     = sections.get("summary", sections.get("objective", ""))[:500]

    all_found_skills = [s for cat in skills.values() for s in cat]

    return {
        # Auto-fill fields for employee form
        "autofill": {
            "name"          : name,
            "email"         : email,
            "phone"         : phone,
            "linkedin_url"  : f"https://{linkedin}" if linkedin else "",
            "github_url"    : f"https://{github}"   if github   else "",
            "summary"       : summary,
            "experience_years": exp_years,
            "experience_level": exp_band,
            "education"     : education,
            "skills"        : all_found_skills,
        },
        # Detailed breakdown
        "skills_by_category": skills,
        "raw_sections"      : list(sections.keys()),
        "total_skills_found": len(all_found_skills),
        "parsed_successfully": bool(name or email),
    }