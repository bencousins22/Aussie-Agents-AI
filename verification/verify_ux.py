
from playwright.sync_api import sync_playwright

def verify_activity_bar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to the app
            page.goto("http://localhost:3002")

            # Wait for ActivityBar to load. It's the sidebar.
            # We look for the "Dashboard" button which we just modified.
            # It should have aria-label="Go to Dashboard"
            dashboard_btn = page.locator('button[aria-label="Go to Dashboard"]')
            dashboard_btn.wait_for(state="visible", timeout=10000)

            # Verify the Collapse button
            collapse_btn = page.locator('button[aria-label="Collapse sidebar"]')
            if not collapse_btn.is_visible():
                 collapse_btn = page.locator('button[aria-label="Expand sidebar"]')
            collapse_btn.wait_for(state="visible", timeout=2000)

            print("Found Dashboard and Collapse buttons with correct ARIA labels.")

            # Take a screenshot of the ActivityBar
            # The ActivityBar is the sidebar on the left.
            # We can screenshot the whole page or just the sidebar if we can find a container.
            # The sidebar container has classes including 'w-48' (when expanded).
            # Let's just screenshot the page for context.
            page.screenshot(path="verification/activity_bar.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_activity_bar()
