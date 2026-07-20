from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    page.goto(
        "https://mplads.mospi.gov.in/digigov/dashboard.html",
        wait_until="domcontentloaded"
    )

    print("Open ONE report (e.g. Allocated Limit for Hon'ble MPs)")
    print("Then come back and press ENTER.")

    input()

    response = page.wait_for_response(
        lambda r: "getTilesReportData" in r.url,
        timeout=60000
    )

    print("\nStatus:", response.status)

    data = response.json()

    print(json.dumps(data, indent=2))

    browser.close()
    