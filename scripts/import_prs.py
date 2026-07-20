import json
import os
from datetime import datetime

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ----------------------------
# Parse dates
# ----------------------------
def parse_date(date_str):
    if not date_str:
        return None

    formats = [
        "%d.%m.%Y",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%d %B %Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date().isoformat()
        except:
            pass

    return None


print("Loading PRS data...")

with open("scripts/output/prs_data.json", "r", encoding="utf-8") as f:
    all_mps = json.load(f)

print(f"{len(all_mps)} MPs loaded")

# ----------------------------------------------------
# Load ALL MPs once
# ----------------------------------------------------
print("Loading MPs from Supabase...")

db = supabase.table("mps").select("id,name").execute()

mp_lookup = {}

for row in db.data:
    mp_lookup[row["name"].strip().lower()] = row["id"]

print(f"{len(mp_lookup)} MPs found in database")

questions = []
debates = []
bills = []

missing = 0

# ----------------------------------------------------
# Build rows
# ----------------------------------------------------
for mp in all_mps:

    name = mp["name"].strip().lower()

    if name not in mp_lookup:
        missing += 1
        continue

    mp_id = mp_lookup[name]
    print(name, "->", mp_id)
    for q in mp["questions"]:
        questions.append({
            "mp_id": mp_id,
            "question_text": q["title"],
            "question_type": q["type"],
            "ministry": q["ministry"],
            "ministry_name": q["ministry"],
            "date": parse_date(q["date"]),
            "source": "PRS"
        })

    for d in mp["debates"]:
        debates.append({
            "mp_id": mp_id,
            "title": d["title"],
            "debate_type": d["type"],
            "date": parse_date(d["date"]),
            "source": "PRS"
        })

    for b in mp["bills"]:
        bills.append({
            "mp_id": mp_id,
            "title": b.get("title"),
            "date_introduced": parse_date(b.get("date")),
            "source": "PRS"
        })

print(f"\nMissing MPs: {missing}")
print(f"Questions: {len(questions)}")
print(f"Debates : {len(debates)}")
print(f"Bills   : {len(bills)}")

# ----------------------------------------------------
# Batch upload
# ----------------------------------------------------
def upload(table, rows, batch_size=500):

    if not rows:
        return

    total = len(rows)

    for i in range(0, total, batch_size):

        batch = rows[i:i + batch_size]

        print(
            f"Uploading {table}: "
            f"{min(i+len(batch), total)}/{total}"
        )

        supabase.table(table).insert(batch).execute()

upload("mp_questions", questions)
upload("mp_debates", debates)
upload("mp_bills", bills)

print("\n✅ Import Complete!")