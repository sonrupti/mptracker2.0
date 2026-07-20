import json
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load MP data
with open("lib/mp-data.json", "r", encoding="utf-8") as f:
    mps = json.load(f)

print(f"Loaded {len(mps)} MPs")

for i, mp in enumerate(mps):

    row = {
        "name": mp["name"],
        "party": mp["party"],
        "constituency": mp["constituency"],
        "region": mp["region"],
        "image_url": mp["image_url"],
        "email": mp["email"],
        "website": mp["website"],
        "twitter": mp["twitter"],
        "status": mp["status"],
        "overall_score": mp["overall_score"],
        "attendance_rate": mp["attendance_rate"],
        "questions_count": mp["questions_count"],
        "debates_count": mp["debates_count"],
        "bills_sponsored": mp["bills_sponsored"],
        "bills_passed": mp["bills_passed"],
        "active_term_years": mp["active_term_years"],
        "ai_summary": mp["ai_summary"],
        "prs_url": mp["prs_url"]
    }

    try:
        supabase.table("mps").insert(row).execute()
        print(f"[{i+1}] Imported: {mp['name']}")
    except Exception as e:
        print(f"[{i+1}] Error importing {mp['name']}: {e}")

print("Done!")