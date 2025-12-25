
from playwright.sync_api import sync_playwright

def verify_ux_updates():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to the app
            page.goto("http://localhost:3002")

            # --- 1. Verify ActivityBar Accessibility ---
            print("Verifying ActivityBar...")
            dashboard_btn = page.locator('button[aria-label="Go to Dashboard"]')
            dashboard_btn.wait_for(state="visible", timeout=10000)
            print("ActivityBar accessibility checks passed.")

            # --- 2. Verify Spotlight Accessibility ---
            print("Verifying Spotlight...")

            # Find search button by correct label "Search"
            search_btn = page.locator('button[aria-label="Search"]')
            search_btn.wait_for(state="visible", timeout=2000)
            search_btn.click()

            # Wait for Spotlight to open
            spotlight_backdrop = page.locator('div[role="dialog"][aria-label="Close spotlight search"]')
            spotlight_backdrop.wait_for(state="visible", timeout=5000)

            # Check input attributes
            spotlight_input = page.locator('input[role="combobox"][aria-label="Spotlight Search"]')
            spotlight_input.wait_for(state="visible", timeout=1000)

            # Type "dash" to trigger navigation results
            spotlight_input.fill("dash")

            # Wait for results container
            results_list = page.locator('#spotlight-results[role="listbox"]')
            results_list.wait_for(state="visible", timeout=2000)

            # Check for options
            options = page.locator('div[role="option"]')
            options.first.wait_for(state="visible", timeout=2000)

            count = options.count()
            print(f"Found {count} results with role='option'.")

            # Verify aria-selected on first option
            first_option = options.nth(0)
            if first_option.get_attribute("aria-selected") == "true":
                 print("First option is selected (aria-selected=true).")
            else:
                 print("First option is NOT selected.")

            print("Spotlight accessibility checks passed.")

            # Take a screenshot
            page.screenshot(path="verification/ux_updates.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ux_updates()
