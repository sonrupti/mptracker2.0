from playwright.sync_api import sync_playwright
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Fetch MPs safely
res = (
    supabase.table("mps")
    .select("id,name,prs_url")
    .not_.is_("prs_url", "null")
    .execute()
)

mps = res.data or []

print(f"Total MPs: {len(mps)}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    for i, mp in enumerate(mps, start=1):
        url = mp.get("prs_url")

        print(f"\n[{i}/{len(mps)}] {mp['name']}")

        # ❗ skip empty URLs safely
        if not url:
            print("Skipping: empty PRS URL")
            continue

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)

            rows = page.locator("table tbody tr")
            count = rows.count()

            print("Rows found:", count)

            for r in range(count):
                row = rows.nth(r)
                links = row.locator("a")

                if links.count() == 0:
                    continue

                title = links.first.inner_text().strip()
                href = links.first.get_attribute("href")

                if not title or not href:
                    continue

                # normalize URL
                if href.startswith("/"):
                    href = "https://prsindia.org" + href

                # ❗ safer filter (do NOT rely on /billtrack/)
                if "prsindia.org" not in href:
                    continue

                print("  Bill:", title)

                # insert into supabase
                res = supabase.table("mp_bills").insert({
                    "mp_id": mp["id"],
                    "title": title,
                    "prs_bill_page_url": href
                }).execute()

                # DEBUG: confirm insert worked
                if res.data:
                    print("    ✅ inserted")
                else:
                    print("    ⚠️ insert failed or blocked")

        except Exception as e:
            print("❌ Error:", str(e))

    browser.close()

print("\nFinished.")