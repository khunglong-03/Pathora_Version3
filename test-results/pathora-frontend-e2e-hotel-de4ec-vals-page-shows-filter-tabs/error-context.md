# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pathora\frontend\e2e\hotel-provider\hotel-provider.spec.ts >> HotelServiceProvider Portal Access >> hotel arrivals page shows filter tabs
- Location: pathora\frontend\e2e\hotel-provider\hotel-provider.spec.ts:165:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * HotelServiceProvider E2E Tests
  5   |  *
  6   |  * Tests the complete user journey for a HotelServiceProvider:
  7   |  * 1. Landing page shows auth modal (via Sign In button)
  8   |  * 2. Login with hotel provider credentials (mai.dt@hotel.vn / thehieu03)
  9   |  * 3. Redirects to /hotel dashboard
  10  |  * 4. Can access rooms, arrivals, and profile pages
  11  |  * 5. Cannot access admin or manager pages
  12  |  *
  13  |  * Run with: npx playwright test e2e/hotel-provider/
  14  |  * Requires: Backend API running at http://localhost:5182
  15  |  */
  16  | 
  17  | const HOTEL_EMAIL = "mai.dt@hotel.vn";
  18  | const HOTEL_PASSWORD = "thehieu03";
  19  | 
  20  | test.describe("HotelServiceProvider Portal Access", () => {
  21  |   test.beforeEach(async ({ page }) => {
  22  |     // Clear cookies to ensure clean state
  23  |     await page.context().clearCookies();
> 24  |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  25  |     await page.waitForLoadState("networkidle");
  26  |   });
  27  | 
  28  |   test.afterEach(async ({ page }) => {
  29  |     // Clean up: logout after each test
  30  |     try {
  31  |       await page.context().clearCookies();
  32  |     } catch {
  33  |       // Ignore errors during cleanup
  34  |     }
  35  |   });
  36  | 
  37  |   test("landing page loads and shows header with auth buttons", async ({ page }) => {
  38  |     await expect(page).toHaveTitle(/Pathora/i);
  39  | 
  40  |     // Header with Sign In button should be visible
  41  |     const signInBtn = page.getByRole("button", { name: /sign in/i });
  42  |     await expect(signInBtn.first()).toBeVisible();
  43  |   });
  44  | 
  45  |   test("login modal opens and form fields exist", async ({ page }) => {
  46  |     // Click Sign In button in header
  47  |     await page.getByRole("button", { name: /sign in/i }).first().click();
  48  | 
  49  |     // Wait for modal to appear
  50  |     await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  51  | 
  52  |     // Email and password fields should be visible
  53  |     await expect(page.locator("#login-email")).toBeVisible();
  54  |     await expect(page.locator("#login-password")).toBeVisible();
  55  |   });
  56  | 
  57  |   test("hotel provider can login and access dashboard", async ({ page }) => {
  58  |     // Open login modal
  59  |     await page.getByRole("button", { name: /sign in/i }).first().click();
  60  |     await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  61  | 
  62  |     // Fill credentials
  63  |     await page.locator("#login-email").fill(HOTEL_EMAIL);
  64  |     await page.locator("#login-password").fill(HOTEL_PASSWORD);
  65  | 
  66  |     // Submit form
  67  |     await page.getByRole("button", { name: /sign in/i }).last().click();
  68  | 
  69  |     // Wait for redirect to hotel dashboard
  70  |     await page.waitForURL(/\/hotel/, { timeout: 15000 });
  71  |     await expect(page).toHaveURL(/\/hotel/);
  72  | 
  73  |     // Dashboard should show the hotel management heading
  74  |     await expect(page.getByText(/KS của tôi|quản lý khách sạn/i)).toBeVisible({ timeout: 10000 });
  75  |   });
  76  | 
  77  |   test("hotel rooms page is accessible after login", async ({ page }) => {
  78  |     // Login first
  79  |     await doHotelLogin(page);
  80  | 
  81  |     // Navigate to rooms page
  82  |     await page.goto("/hotel/rooms");
  83  |     await page.waitForLoadState("networkidle");
  84  | 
  85  |     // Should show rooms management page
  86  |     await expect(page).toHaveURL(/\/hotel\/rooms/);
  87  |     await expect(page.getByText(/quản lý phòng|room management/i)).toBeVisible({ timeout: 10000 });
  88  |   });
  89  | 
  90  |   test("hotel arrivals page is accessible after login", async ({ page }) => {
  91  |     // Login first
  92  |     await doHotelLogin(page);
  93  | 
  94  |     // Navigate to arrivals page
  95  |     await page.goto("/hotel/arrivals");
  96  |     await page.waitForLoadState("networkidle");
  97  | 
  98  |     // Should show arrivals page
  99  |     await expect(page).toHaveURL(/\/hotel\/arrivals/);
  100 |     await expect(page.getByText(/check-in khách|check-in/i)).toBeVisible({ timeout: 10000 });
  101 |   });
  102 | 
  103 |   test("hotel profile page is accessible after login", async ({ page }) => {
  104 |     // Login first
  105 |     await doHotelLogin(page);
  106 | 
  107 |     // Navigate to profile page
  108 |     await page.goto("/hotel/profile");
  109 |     await page.waitForLoadState("networkidle");
  110 | 
  111 |     // Should show profile page
  112 |     await expect(page).toHaveURL(/\/hotel\/profile/);
  113 |     await expect(page.getByText(/thông tin khách sạn|hotel profile/i)).toBeVisible({ timeout: 10000 });
  114 |   });
  115 | 
  116 |   test("unauthenticated user cannot access hotel routes", async ({ page }) => {
  117 |     // Clear cookies and try direct access
  118 |     await page.context().clearCookies();
  119 |     await page.goto("/hotel");
  120 |     await page.waitForLoadState("networkidle");
  121 | 
  122 |     // Should redirect to login (landing page with auth modal)
  123 |     // Either redirected to home/landing or login modal shown
  124 |     const currentUrl = page.url();
```