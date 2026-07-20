from playwright.sync_api import sync_playwright
import json
import os


def scrape_mp(page, url):
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_timeout(5000)

    data = {
        "mp_url": url,
        "name": "",
        "questions": [],
        "debates": [],
        "bills": []
    }

    # ----------------------------
    # MP Name
    # ----------------------------
    try:
        data["name"] = page.locator("h1").inner_text().strip()
    except:
        pass

    # ----------------------------
    # QUESTIONS
    # ----------------------------
    try:
        question_rows = page.locator(
            "section#block-views-mp-related-views-block-2222 tbody tr"
        )

        for i in range(question_rows.count()):
            row = question_rows.nth(i)
            cols = row.locator("td")

            if cols.count() >= 4:
                data["questions"].append({
                    "date": cols.nth(0).inner_text().strip(),
                    "title": cols.nth(1).inner_text().strip(),
                    "type": cols.nth(2).inner_text().strip(),
                    "ministry": cols.nth(3).inner_text().strip()
                })

    except Exception as e:
        print("Questions Error:", e)

    # ----------------------------
    # DEBATES
    # ----------------------------
    try:
        debate_rows = page.locator(
            "section#block-views-mps-debate-related-views-block tbody tr"
        )

        for i in range(debate_rows.count()):
            row = debate_rows.nth(i)
            cols = row.locator("td")

            if cols.count() >= 3:
                data["debates"].append({
                    "date": cols.nth(0).inner_text().strip(),
                    "title": cols.nth(1).inner_text().strip(),
                    "type": cols.nth(2).inner_text().strip()
                })

    except Exception as e:
        print("Debates Error:", e)

    # ----------------------------
    # Bills (Most MPs don't have a detailed bills table)
    # ----------------------------
    try:
        bill_rows = page.locator(
            "section#block-views-private-members-bills-block tbody tr"
        )

        for i in range(bill_rows.count()):
            row = bill_rows.nth(i)
            cols = row.locator("td")

            if cols.count() >= 2:
                data["bills"].append({
                    "date": cols.nth(0).inner_text().strip(),
                    "title": cols.nth(1).inner_text().strip()
                })

    except:
        pass

    return data


def main():
    os.makedirs("scripts/output", exist_ok=True)

    with open("scripts/output/mp_links.json", "r", encoding="utf-8") as f:
        links = json.load(f)

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        page = browser.new_page(
            viewport={"width": 1400, "height": 900}
        )

        for i, url in enumerate(links):
            print(f"[{i+1}/{len(links)}] {url}")

            try:
                mp = scrape_mp(page, url)
                results.append(mp)

                print(
                    f"Questions: {len(mp['questions'])} | "
                    f"Debates: {len(mp['debates'])} | "
                    f"Bills: {len(mp['bills'])}"
                )

            except Exception as e:
                print("Failed:", e)

        browser.close()

    with open(
        "scripts/output/prs_data.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\nDone!")
    print("Saved to scripts/output/prs_data.json")


if __name__ == "__main__":
    main()