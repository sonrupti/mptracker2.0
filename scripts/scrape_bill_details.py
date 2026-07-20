from playwright.sync_api import sync_playwright
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

bills = (
    supabase.table("mp_bills")
    .select("id,title,prs_bill_page_url")
    .not_.is_("prs_bill_page_url", "null")
    .execute()
    .data
)

print("Bills found:", len(bills))

with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    # Block unnecessary resources
    def block_resources(route):
        if route.request.resource_type in ["image", "font", "media", "stylesheet"]:
            route.abort()
        else:
            route.continue_()

    page.route("**/*", block_resources)

    for i, bill in enumerate(bills, start=1):

        print(f"\n[{i}/{len(bills)}] {bill['title']}")

        try:

            page.goto(
                bill["prs_bill_page_url"],
                wait_until="domcontentloaded",
                timeout=10000
            )

            print("Loaded:", page.url)

            data = {}

            # ---------- Bill Type ----------
            try:
                txt = page.locator("text=Type").locator("..").inner_text(timeout=2000)
                data["bill_type"] = txt.replace("Type", "").strip()
            except:
                pass

            # ---------- Status ----------
            try:
                txt = page.locator("text=Status").locator("..").inner_text(timeout=2000)
                data["status"] = txt.replace("Status", "").strip()
            except:
                pass

            # ---------- Ministry ----------
            try:
                txt = page.locator("text=Ministry").locator("..").inner_text(timeout=2000)
                data["ministry"] = txt.replace("Ministry", "").strip()
            except:
                pass

            # ---------- PRS Bill PDF ----------
            try:
                pdf = page.locator("a:has-text('Bill')").first.get_attribute("href", timeout=2000)
                if pdf:
                    if pdf.startswith("/"):
                        pdf = "https://prsindia.org" + pdf
                    data["prs_bill_pdf_url"] = pdf
            except:
                pass

            # ---------- Summary ----------
            try:
                summary = page.locator("a:has-text('Summary')").first.get_attribute("href", timeout=2000)
                if summary:
                    if summary.startswith("/"):
                        summary = "https://prsindia.org" + summary
                    data["prs_summary_url"] = summary
            except:
                pass

            # ---------- Amendments ----------
            try:
                amend = page.locator("a:has-text('Amend')").first.get_attribute("href", timeout=2000)
                if amend:
                    if amend.startswith("/"):
                        amend = "https://prsindia.org" + amend
                    data["prs_amendments_url"] = amend
            except:
                pass

            # ---------- History ----------
            try:
                history = page.locator("a:has-text('History')").first.get_attribute("href", timeout=2000)
                if history:
                    if history.startswith("/"):
                        history = "https://prsindia.org" + history
                    data["prs_history_url"] = history
            except:
                pass

            # ---------- Sansad ----------
            try:
                sansad = page.locator("a[href*='sansad.in']").first.get_attribute("href", timeout=2000)
                if sansad:
                    data["sansad_page_url"] = sansad
            except:
                pass

            if data:

                supabase.table("mp_bills") \
                    .update(data) \
                    .eq("id", bill["id"]) \
                    .execute()

                print(f"✅ Updated {len(data)} fields")

            else:
                print("⚠️ No fields found")

        except Exception as e:
            print("❌ Error:", e)

    browser.close()

print("\nFinished!")