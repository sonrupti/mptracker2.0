from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page(viewport={"width": 1400, "height": 900})

    page.goto("https://prsindia.org/mptrack/18th-lok-sabha/kishori-lal")

    page.wait_for_timeout(8000)

    print("Title:", page.title())

    page.screenshot(path="page.png", full_page=True)

    with open("page.html", "w", encoding="utf-8") as f:
        f.write(page.content())

    print("Done!")

    browser.close()