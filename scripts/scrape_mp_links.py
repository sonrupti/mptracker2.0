import json
from playwright.sync_api import sync_playwright

BASE_URL = "https://prsindia.org/mptrack"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        page.goto(BASE_URL)
        page.wait_for_load_state("domcontentloaded")

        # better scrolling
        last_height = 0
        for i in range(50):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

            new_height = page.evaluate("document.body.scrollHeight")
            print(f"Scrolling... {i+1}/50")

            if new_height == last_height:
                break
            last_height = new_height

        links = page.evaluate("""
            () => Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(h => h.includes('/mptrack/') && h.includes('lok-sabha'))
        """)

        links = list(set(links))

        print("Total MPs found:", len(links))

        with open("scripts/output/mp_links.json", "w", encoding="utf-8") as f:
            json.dump(links, f, indent=2)

        browser.close()

if __name__ == "__main__":
    main()